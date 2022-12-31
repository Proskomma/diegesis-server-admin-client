import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {searchQuery} from '../lib/search';
import TranslationsTable from "./TranslationsTable";
import {gql, useQuery} from "@apollo/client";
import GqlError from "./GqlError";
import {Button, Typography, Grid} from "@mui/material";
import Spinner from './Spinner';
import {ArrowForward} from '@mui/icons-material';

export default function ListView({searchOrg, searchLang, searchText}) {

    const queryString = searchQuery(
        `query localTranslations {
        orgs {
            id: name
            localTranslations%searchClause% {
                id
                languageCode
                owner
                revision
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
    );

    const columns = [
        {id: 'docSet', label: 'DocSet', minWidth: 300},
        {id: 'actions', label: 'Actions', minWidth: 50}
    ];

    function createData(localTranslation, orgId) {
        return {
            docSet: <>
                <Typography variant="body2">{localTranslation.owner}@{orgId}</Typography>
                <Typography sx={{fontWeight: 'bold'}}
                            variant="body1">{localTranslation.title} ({localTranslation.languageCode})</Typography>
                <Typography variant="body2"
                            sx={{fontStyle: "italic"}}>{localTranslation.id} revision {localTranslation.revision}</Typography>
            </>,
            actions: <Grid container sx={{"textAlign": "right"}}>
                <Grid item xs={12}>
                    <RouterLink
                        to={`/entry/browse/${orgId}/${localTranslation.owner}/${localTranslation.id}/${localTranslation.revision}`}><ArrowForward/></RouterLink>
                </Grid>
            </Grid>
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
                if (so === 'all' || so === orgData.id.toLowerCase()) {
                    rows.push(createData(lt, orgData.id));
                }
            }
        );
    }
    return <TranslationsTable columns={columns} rows={rows}/>


}
