const path = require("path");
const fse = require('fs-extra');
const express = require("express");
const helmet = require("helmet");
const {ApolloServer} = require("apollo-server-express");
const {mergeTypeDefs} = require('@graphql-tools/merge')
const morgan = require('morgan');
const winston = require('winston');
const shajs = require('sha.js');
const cookieParser = require('cookie-parser');
const {randomInt} = require('node:crypto');
const makeResolvers = require("../graphql/resolvers/index.js");
const {scalarSchema, querySchema, mutationSchema} = require("../graphql/schema/index.js");
const {doRenderCron, doSessionCron} = require("./cron.js");

const appRoot = path.resolve(".");

async function makeServer(config) {
    // Express
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(helmet({
        crossOriginEmbedderPolicy: !config.debug,
        contentSecurityPolicy: !config.debug,
    }));
    app.use(cookieParser());
    if (config.useCors) {
        app.all('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Credentials', true);
            next();
        });
    }
    // Maybe static, each with optional 'to root' redirects
    if (config.staticPaths) {
        for (const staticPathSpec of config.staticPaths) {
            app.use(staticPathSpec.url, express.static(staticPathSpec.path));
            for (const redirect of staticPathSpec.redirects) {
                app.get(redirect, (req, res) => {
                    res.sendFile(staticPathSpec.redirectTarget, function (err) {
                        if (err) {
                            res.status(500).send(err)
                        }
                    })
                });
            }
        }
    }

    // Maybe copy local translations
    if (config.localUsxPath) {
        const targetDir = path.join(config.dataPath, 'localusx');
        if (fse.pathExistsSync(targetDir)) {
            fse.removeSync(targetDir);
        }
        fse.copySync(config.localUsxPath, targetDir);
    }

    // Maybe HTML endpoints
    if (config.debug) {
        // Hello world index
        app.get('/', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'index.xhtml'));
        });

        // DIY GraphQL form
        app.get('/gql_form', (req, res) => {
            res.sendFile(path.resolve(appRoot, 'src', 'html', 'gql_form.xhtml'));
        });
    }

    // Login
    app.superusers = config.superusers;
    if (Object.keys(app.superusers).length > 0) {
        app.sessionTimeoutInMins = config.sessionTimeoutInMins;
        app.authSalts = [shajs('sha256').update(randomInt(1000000, 9999999).toString()).digest('hex')];
        app.authSalts.push(app.authSalts[0]);  // Start with 2 identical salts

        doSessionCron(app, `${config.sessionTimeoutInMins} min`);

        app.get('/login', (req, res) => {
            const payload = fse.readFileSync(path.resolve(appRoot, 'src', 'html', 'login.html')).toString().replace('%redirect%', req.query.redirect || '/');
            res.send(payload);
        });

        app.post('/new-login-auth', function (request, response) {
            const failMsg = "Could not authenticate (bad username/password?)";
            let username = request.body.username;
            let password = request.body.password;
            if (!username || !password) {
                response.send('Please include username and password!');
            } else {
                const superPass = app.superusers[username];
                if (!superPass) {
                    response.send(failMsg);
                } else {
                    const hash = shajs('sha256').update(`${username}${password}`).digest('hex');
                    if (hash !== superPass) {
                        response.send(failMsg);
                    } else {
                        const sessionCode = `${username}-${shajs('sha256').update(`${hash}-${app.authSalts[app.authSalts.length - 1]}`).digest('hex')}`;
                        response.cookie(
                            'diegesis-auth',
                            sessionCode,
                            {
                                expires: new Date(new Date().getTime() + app.sessionTimeoutInMins * 60 * 1000)
                            }
                        );
                        response.redirect(request.body.redirect || '/');
                    }
                }
            }
        });

        app.post('/session-auth', function (req, res) {
            const failJson = {authenticated: false, msg: "Could not authenticate (bad session?)"};
            let session = req.body.session;
            if (!session) {
                res.send({authenticated: false, msg: "Please include session!"});
            } else {
                // Get username and server-side hash for that user
                const username = session.split('-')[0];
                const superPass = app.superusers[username];
                if (!superPass) {
                    res.send(failJson);
                } else {
                    let matched = false;
                    for (const salt of app.authSalts) {
                        // Make sessionCode for this user using the server-side hash and salt
                        const session2 = `${username}-${shajs('sha256').update(`${superPass}-${salt}`).digest('hex')}`;
                        // Compare this new sessionCode with the one the client provided
                        if (session2 === session) {
                            matched = true;
                            break;
                        }
                    }
                    if (matched) {
                        res.send({authenticated: true, msg: "Success"});
                    } else {
                        res.send(failJson);
                    }
                }
            }
        });
    }

    // Maybe log access using Morgan
    if (config.logAccess) {
        if (config.accessLogPath) {
            const accessLogStream = fse.createWriteStream(config.accessLogPath, {flags: 'a'});
            app.use(
                morgan(
                    config.logFormat,
                    {stream: accessLogStream}
                )
            );
        } else {
            app.use(
                morgan(config.logFormat)
            );
        }
    }

    // Log incidents using Winston
    config.incidentLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.Console()],
    });

    // Delete lock files and maybe generated files and directories
    for (const org of fse.readdirSync(config.dataPath)) {
        const orgDir = path.join(config.dataPath, org);
        if (fse.pathExistsSync(orgDir) && fse.lstatSync(orgDir).isDirectory()) {
            for (const trans of fse.readdirSync(orgDir)) {
                const transDir = path.join(orgDir, trans);
                for (const revision of fse.readdirSync(transDir)) {
                    const revisionDir = path.join(transDir, revision);
                    for (const toRemove of (config.deleteGenerated ? ["succinct.json", "succinctError.json", "lock.json", "sofriaBooks", "perfBooks"] : ["lock.json"])) {
                        fse.remove(path.join(revisionDir, toRemove));
                    }
                }
            }
        }
    }

    // Apollo server
    const resolvers = await makeResolvers(config);
    const server = new ApolloServer({
        typeDefs: mergeTypeDefs(
            config.includeMutations ?
                [scalarSchema, querySchema, mutationSchema] :
                [scalarSchema, querySchema]
        ),
        resolvers,
        debug: config.debug,
        context: ({req}) => {
            return {
                app: {
                    
                },
                cookies: req.cookies || {}
            };
        }
    });

    // Maybe start cron
    if (config.cronFrequency !== 'never') {
        doRenderCron(config);
    }

    // Start server
    await server.start();
    server.applyMiddleware({app});
    return app;
}

module.exports = makeServer;
