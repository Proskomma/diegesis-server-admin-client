import React from 'react';
import {
    createBrowserRouter,
    RouterProvider,
    useRouteError,
} from "react-router-dom";
import {ApolloProvider, ApolloClient, InMemoryCache} from "@apollo/client";
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
import BlendPage from "./pages/BlendPage";
import EntryDetailsPage from "./pages/EntryDetailsPage";
import EntryBrowsePage from "./pages/EntryBrowsePage";
import EntryDownloadPage from "./pages/EntryDownloadPage";

function App() {

    const theme = createTheme({});

    const client = new ApolloClient(
        {
            uri: '/graphql',
            cache: new InMemoryCache(),
        }
    );

    function ErrorBoundary() {
        let error = useRouteError();
        console.error(error);
        return <div>An unexpected error has occurred: <i>{error.message}</i></div>;
    }

    const router = createBrowserRouter([
        {
            path: "/",
            element: <HomePage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/who",
            element: <WhoPage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/how",
            element: <HowPage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/list",
            element: <ListPage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/blend",
            element: <BlendPage />,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/entry/details/:source/:owner/:entryId/:revision",
            element: <EntryDetailsPage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/entry/browse/:source/:owner/:entryId/:revision",
            element: <EntryBrowsePage/>,
            errorElement: <ErrorBoundary/>
        },
        {
            path: "/entry/download/:source/:owner/:entryId/:revision",
            element: <EntryDownloadPage/>,
            errorElement: <ErrorBoundary/>
        }
    ]);

    return (<ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <RouterProvider router={router}/>
            </ThemeProvider>
        </ApolloProvider>
    );
}

export default App;
