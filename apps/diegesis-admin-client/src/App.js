import React, {useState, useEffect, useMemo} from 'react';
import {Link} from 'react-router-dom';
import Cookies from 'js-cookie';
import {
    ApolloClient,
    ApolloProvider, gql,
    InMemoryCache,
} from "@apollo/client";
import {
    Box,
    Container,
    createTheme,
    CssBaseline,
    Paper,
    ThemeProvider,
    Typography,
} from '@mui/material';
import Header from './components/Header';
import TabbedBody from './components/TabbedBody';
import './App.css';

function App() {
    const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
    const [searchLang, setSearchLang] = useState('');
    const [searchText, setSearchText] = useState('');
    const [orgs, setOrgs] = useState([]);
    const [authed, setAuthed] = useState(true);

    const sessionCode = Cookies.get('diegesis-auth');

    if (!sessionCode) {
        setAuthed(false);
    } else {
        fetch('/session-auth', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                session: sessionCode,
            })
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.authenticated) {
                    console.log(data.msg);
                    setAuthed(false);
                }
            })
            .catch((err) => {
                console.log(err.message);
            });
    }

    const theme = createTheme({});

    const client = new ApolloClient(
        {
            uri: 'http://localhost:1234/graphql',
            cache: new InMemoryCache(),
        }
    );

    const memoClient = useMemo(() => client);

    useEffect(
        () => {
            const doOrgs = async () => {
                const result = await memoClient.query({query: gql`{ orgs { id: name } }`});
                setOrgs(result.data.orgs.map(o => o.id));
            };
            doOrgs();
        },
        []
    );

    return (<ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Container fixed className="App">
                {
                    !authed &&
                    <div>You need to authenticate to view this page. Please click <a href="/login">here</a> to log in</div>
                }
                {
                    authed &&
                    <>
                        <Header
                            orgs={orgs}
                            selectedOrgIndex={selectedOrgIndex}
                            setSelectedOrgIndex={setSelectedOrgIndex}
                            searchLang={searchLang}
                            setSearchLang={setSearchLang}
                            searchText={searchText}
                            setSearchText={setSearchText}
                        />
                        <Box id="body">
                            {orgs.length > 0 ?
                                <TabbedBody
                                    selectedOrg={orgs[selectedOrgIndex]}
                                    searchLang={searchLang}
                                    searchText={searchText}
                                /> :
                                <Paper sx={{width: '100%', overflow: 'hidden'}}>
                                    <Box>
                                        <Typography variant="h3">Loading</Typography>
                                    </Box>
                                </Paper>
                            }
                        </Box>
                    </>
                }
                    </Container>
                    </ThemeProvider>
                    </ApolloProvider>
                    );
                }

                export default App;
