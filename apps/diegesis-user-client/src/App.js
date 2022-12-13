import React, {useState, useEffect, useMemo} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import {
    ApolloClient,
    ApolloProvider, gql,
    InMemoryCache,
} from "@apollo/client";
import {
    createTheme,
    CssBaseline,
    ThemeProvider,
} from '@mui/material';
import './App.css';
import HomePage from "./pages/HomePage";
import WhoPage from "./pages/WhoPage";
import HowPage from "./pages/HowPage";
import ListPage from "./pages/ListPage";
import EntryDetailsPage from "./pages/EntryDetailsPage";
import EntryBrowsePage from "./pages/EntryBrowsePage";
import EntryDownloadPage from "./pages/EntryDownloadPage";

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

    const router = createBrowserRouter([
        {
            path: "/",
            element: <HomePage />,
        },
        {
            path: "/who",
            element: <WhoPage />
        },
        {
            path: "/how",
            element: <HowPage />
        },
        {
            path: "/list",
            element: <ListPage
                orgs={orgs}
                searchOrg={searchOrg}
                setSearchOrg={setSearchOrg}
                searchLang={searchLang}
                setSearchLang={setSearchLang}
                searchText={searchText}
                setSearchText={setSearchText}
            />,
        },
        {
            path: "/entry/details/:source/:owner/:entryId/:revision",
            element: <EntryDetailsPage />
        },
        {
            path: "/entry/browse/:source/:owner/:entryId/:revision",
            element: <EntryBrowsePage />
        },
        {
            path: "/entry/download/:source/:owner/:entryId/:revision",
            element: <EntryDownloadPage />
        }
    ]);

    return (<ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <RouterProvider router={router} />
            </ThemeProvider>
        </ApolloProvider>
    );
}

export default App;
