import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {searchQuery} from '../lib/search';
import {gql, useQuery} from "@apollo/client";
import GqlError from "./GqlError";
import {Button, Typography, Grid} from "@mui/material";
import Spinner from './Spinner';

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

    function rowData(localTranslation, orgId) {
        return <Grid container xs={12} sx={{borderTop: "solid 1px #ccc", padding: "2px", marginBottom: "2px"}}>
            <Grid item xs={12} md={3}>
                <Typography variant="body2">{orgId}</Typography>
                <Typography variant="body2">{localTranslation.owner}</Typography>
            </Grid>
            <Grid item xs={11} md={6}>
                <RouterLink
                    to={`/entry/browse/${orgId}/${localTranslation.owner}/${localTranslation.id}/${localTranslation.revision}`}
                    style={{textDecoration: "none"}}> <Typography sx={{fontWeight: 'bold', textAlign: "center"}} variant="body1">
                    {localTranslation.title}
                </Typography>
                </RouterLink>
            </Grid>
            <Grid item xs={1}>
                <Typography variant="body2" sx={{textAlign: "right"}}>{localTranslation.languageCode}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
                <Typography variant="body2" sx={{textAlign: "right"}}>
                    ID {localTranslation.id}
                </Typography>
                <Typography variant="body2" sx={{textAlign: "right"}}>
                    Rev {localTranslation.revision}
                </Typography>
            </Grid>
        </Grid>
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
                    rows.push(rowData(lt, orgData.id));
                }
            }
        );
    }
    return <Grid container xs={12}>
        {rows}
    </Grid>


}
