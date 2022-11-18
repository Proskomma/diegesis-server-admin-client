import React from 'react';
import { searchQuery } from '../lib/search';
import TranslationsTable from "./TranslationsTable";
import {gql, useQuery,useApolloClient,} from "@apollo/client";
//import GqlLoading from "./GqlLoading";
import GqlError from "./GqlError";
//import { deleteTranslation } from '../lib/tableCallbacks';
//import { Button } from '@mui/material';
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import SmsFailedTwoTone from '@mui/icons-material/SmsFailedTwoTone';
import Spinner from './Spinner';

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
            label: 'USFM',
            minWidth: 50,
            align: 'center',
            format: value => value ? iconYes() : iconNo()
        },
        {
            id: 'hasUsx',
            label: 'USX',
            minWidth: 50,
            align: 'center',
            format: value => value ? iconYes() : iconNo()
        },
        {
            id: 'hasSuccinct',
            label: 'Succinct',
            minWidth: 50,
            align: 'center',
        },
        {
            id: 'hasVrs',
            label: 'VRS',
            minWidth: 50,
            align: 'center',
            format: value => value ? iconYes() : iconNo()
        },
    ];

    function iconYes() {
        return <CheckBoxOutlined sx={{ fontSize: 15}}/>
    }

    function iconNo() {
        return <CheckBoxOutlineBlank sx={{ fontSize: 15}}/>
    }

    function iconFail(failMessage) {
        return <SmsFailedTwoTone titleAccess={failMessage} sx={{ fontSize: 15, color: 'red', fontWeight: 'bold'}} />
    }

    function createData(localTranslation) {
        let succinctState = localTranslation.hasSuccinct ? iconYes() : iconNo();
        if (localTranslation.hasSuccinctError) {
            succinctState = iconFail('Succinct error');
        }
        return {
            id: localTranslation.id,
            languageCode: localTranslation.languageCode,
            title: localTranslation.title,
            hasUsfm: localTranslation.hasUsfm,
            hasUsx: localTranslation.hasUsx,
            hasSuccinct: succinctState,
            hasVrs: localTranslation.hasVrs
        };
    }

    if (loading) {
        return <Spinner />
    }
    if (error) {
        return <GqlError error={error} />
    }
    const rows = data.org.localTranslations.map(lt => createData(lt));
    return <TranslationsTable columns={columns} rows={rows}/>


}
