import React, {useState, useEffect, useMemo} from 'react';
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
    ThemeProvider,
} from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import './App.css';
import ListView from "./components/ListView";

function App() {
    const [searchOrg, setSearchOrg] = useState('all');
    const [searchLang, setSearchLang] = useState('');
    const [searchText, setSearchText] = useState('');
    const [orgs, setOrgs] = useState([]);

    const theme = createTheme({});

    const client = new ApolloClient(
        {
            uri: '/graphql',
            cache: new InMemoryCache(),
        }
    );

    const memoClient = useMemo(() => client);

    // This piece runs once, when the page is rendered
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
                    <Header
                        orgs={orgs}
                        searchOrg={searchOrg}
                        setSearchOrg={setSearchOrg}
                        searchLang={searchLang}
                        setSearchLang={setSearchLang}
                        searchText={searchText}
                        setSearchText={setSearchText}
                    />
                    <Box id="body">
                        {orgs.length > 0 ?
                            <ListView searchOrg={searchOrg} searchLang={searchLang} searchText={searchText}/>
                            :
                            <Spinner/>
                        }
                    </Box>
                    <Footer />
                </Container>
            </ThemeProvider>
        </ApolloProvider>
    );
}

export default App;
