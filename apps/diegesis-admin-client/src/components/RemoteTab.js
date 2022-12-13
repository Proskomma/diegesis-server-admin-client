import React from 'react';
import {
    gql,
    useQuery,
    useApolloClient,
} from "@apollo/client";

import { Button } from '@mui/material';
import {Download} from '@mui/icons-material';

import TranslationsTable from "./TranslationsTable";
import { searchQuery } from '../lib/search';
import { fetchTranslation } from '../lib/tableCallbacks';
import GqlLoading from "./GqlLoading";
import GqlError from "./GqlError";

export default function RemoteTab({selectedOrg, searchLang, searchText}) {

    const client = useApolloClient();

    const queryString = searchQuery(
        `query catalogEntries {
            org(name: "%org%") {
                id: name
                fullName,
                contentType
                catalogEntries%searchClause% {
                    id
                    languageCode
                    title
                }
            }
        }`,
        selectedOrg,
        searchLang,
        searchText);

    const {loading, error, data} = useQuery(
        gql`${queryString}`,
        {pollInterval: 2000}
    );

    const columns = [
        {id: 'id', label: 'ID', minWidth: 100},
        {id: 'languageCode', label: 'Language', minWidth: 50},
        {
            id: 'title',
            label: 'Title',
            minWidth: 200,
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'right',
        },
    ];

    function createData(catalogEntry, contentType) {
        return {
            id: catalogEntry.id,
            languageCode: catalogEntry.languageCode,
            title: catalogEntry.title,
            actions: <Button
                disabled={catalogEntry.hasLocalUsfm || catalogEntry.hasLocalUsx}
                onClick={
                    () => fetchTranslation(
                        client,
                        selectedOrg,
                        catalogEntry.id,
                        contentType
                    )
                }
            >
                <Download/>
            </Button>
        };
    }

    if (loading) {
        return <GqlLoading />
    }
    if (error) {
        return <GqlError error={error} />
    }
    const orgContentType = data?.org.contentType;
    const rows = data.org.catalogEntries.map(ce => createData(ce, orgContentType));
    return <TranslationsTable columns={columns} rows={rows}/>
}
