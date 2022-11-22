import React from 'react';
import {searchQuery} from '../lib/search';
import TranslationsTable from "./TranslationsTable";
import {gql, useQuery} from "@apollo/client";
import GqlError from "./GqlError";
import {Button} from "@mui/material";
import Spinner from './Spinner';
import {Download, Book, Info} from '@mui/icons-material';

export default function ListView({searchOrg, searchLang, searchText}) {

    const queryString = searchQuery(
        `query localTranslations {
        orgs {
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
        searchLang,
        searchText
    );

    const {loading, error, data} = useQuery(
        gql`${queryString}`,
        {pollInterval: 2000}
    );

    const columns = [
        {id: 'org', label: 'Org', minWidth: 50},
        {id: 'id', label: 'ID', minWidth: 100},
        {id: 'languageCode', label: 'Language', minWidth: 50},
        {
            id: 'title',
            label: 'Title',
            minWidth: 100,
        },
        {id: 'actions', label: 'Actions', minWidth: 100}
    ];

    function createData(localTranslation, orgId) {
        return {
            org: orgId,
            id: localTranslation.id,
            languageCode: localTranslation.languageCode,
            title: localTranslation.title,
            actions: <>
                <Button>
                    <Info/>
                </Button>
                <Button>
                    <Book/>
                </Button>
                <Button>
                    <Download/>
                </Button>
            </>
        };
    }

    if (loading) {
        return <Spinner/>
    }
    if (error) {
        return <GqlError error={error}/>
    }
    let rows = [];
    const so = searchOrg.trim().toLowerCase();
    for (const orgData of data.orgs) {
        orgData.localTranslations.forEach(
            lt => {
                if (so === '' || so === orgData.id.toLowerCase()) {
                    rows.push(createData(lt, orgData.id));
                }
            }
        );
    }
    return <TranslationsTable columns={columns} rows={rows}/>


}
