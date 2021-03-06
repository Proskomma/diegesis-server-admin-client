import React from 'react';
import { searchQuery } from '../lib/search';
import TranslationsTable from "./TranslationsTable";
import {gql, useQuery,useApolloClient,} from "@apollo/client";
import GqlLoading from "./GqlLoading";
import GqlError from "./GqlError";
import { deleteTranslation } from '../lib/tableCallbacks';
import { Button } from '@mui/material';
import {Delete} from '@mui/icons-material';

export default function LocalTab({selectedOrg, searchLang, searchText}) {

    const client = useApolloClient();

    const queryString = searchQuery(
        `query localTranslations {
        org(name: "%org%") {
            id: name
            localTranslations%searchClause% {
                id
                languageCode
                title
                hasUsfm
                hasUsx
                hasSuccinct
                hasSuccinctError
                hasVrs
            }
        }
    }`,
        selectedOrg,
        searchLang,
        searchText
    );

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
            id: 'hasUsfm',
            label: 'USFM?',
            minWidth: 50,
            align: 'right',
            format: value => value ? "yes" : "no"
        },
        {
            id: 'hasUsx',
            label: 'USX?',
            minWidth: 50,
            align: 'right',
            format: value => value ? "yes" : "no"
        },
        {
            id: 'hasSuccinct',
            label: 'Succinct?',
            minWidth: 50,
            align: 'right',
        },
        {
            id: 'hasVrs',
            label: 'VRS?',
            minWidth: 50,
            align: 'right',
            format: value => value ? "yes" : "no"
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'right',
        },
    ];

    function createData(localTranslation) {
        let succinctState = localTranslation.hasSuccinct ? 'yes' : 'no';
        if (localTranslation.hasSuccinctError) {
            succinctState = 'FAIL';
        }
        return {
            id: localTranslation.id,
            languageCode: localTranslation.languageCode,
            title: localTranslation.title,
            hasUsfm: localTranslation.hasUsfm,
            hasUsx: localTranslation.hasUsx,
            hasSuccinct: succinctState,
            hasVrs: localTranslation.hasVrs,
            actions: <Button
                onClick={
                    () => deleteTranslation(
                        client,
                        selectedOrg,
                        localTranslation.id,
                    )
                }
            >
                <Delete/>
            </Button>
        };
    }

    if (loading) {
        return <GqlLoading />
    }
    if (error) {
        return <GqlError error={error} />
    }
    const rows = data.org.localTranslations.map(lt => createData(lt));
    return <TranslationsTable columns={columns} rows={rows}/>

}
