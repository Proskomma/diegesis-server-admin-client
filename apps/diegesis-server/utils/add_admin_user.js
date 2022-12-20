const shajs = require('sha.js');
const path = require("path");
const fse = require('fs-extra');

if (process.argv.length !== 5) {
    console.log("USAGE: node add_admin_user.js <configPath> <username> <password>");
    process.exit(1);
}

const configPath = path.resolve(process.argv[2]);
let config;
try {
    config = fse.readJsonSync(configPath);
} catch (err) {
    console.log(`Could not load config file '${configPath}'`);
    process.exit(1);
}
const userName = process.argv[3];
const password = process.argv[4];
const hash = shajs('sha256').update(`${userName}${password}`).digest('hex');
if (!config.superusers) {
    config.superusers = {};
}
config.superusers[userName] = hash;
fse.writeFileSync(configPath, JSON.stringify(config, null, 2));
