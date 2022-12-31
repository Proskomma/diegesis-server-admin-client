import React from 'react';
import {useQuery, gql} from "@apollo/client";
import {Link as RouterLink} from 'react-router-dom';
import {Typography, Grid} from "@mui/material";
import {searchQuery} from '../lib/search';
import GqlError from "./GqlError";
import Spinner from './Spinner';

export default function ListView({searchTerms}) {

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
                nOT,
                nNT,
                nDC,
                hasIntroductions,
                hasHeadings,
                hasFootnotes,
                hasXrefs,
            }
        }
    }`,
        searchTerms
    );

    const {loading, error, data} = useQuery(
        gql`${queryString}`,
    );


    function rowData(localTranslation, orgId) {
        const canonStrings = [];
        if (localTranslation.nOT && localTranslation.nOT > 0) {
            canonStrings.push(`${localTranslation.nOT} OT`);
        }
        if (localTranslation.nNT && localTranslation.nNT > 0) {
            canonStrings.push(`${localTranslation.nNT} NT`);
        }
        if (localTranslation.nDC && localTranslation.nDC > 0) {
            canonStrings.push(`${localTranslation.nDC} DC`);
        }
        const featureStrings = [];
        if (localTranslation.hasIntroductions) {
            featureStrings.push("Intros");
        }
        if (localTranslation.hasHeadings) {
            featureStrings.push("Headings");
        }
        if (localTranslation.hasFootnotes) {
            featureStrings.push("Footnotes");
        }
        if (localTranslation.hasXrefs) {
            featureStrings.push("Xrefs");
        }
        return <Grid container xs={12} sx={{borderTop: "solid 1px #ccc", padding: "2px", marginBottom: "2px"}}>
            <Grid item xs={12} md={2}>
                <Typography variant="body2" sx={{fontWeight: "bold", fontSize: "x-small"}}>{localTranslation.owner}@{orgId}</Typography>
                <Typography variant="body2" sx={{fontWeight: "bold", fontSize: "x-small"}}>{localTranslation.languageCode}</Typography>
            </Grid>
            <Grid item xs={10} md={6}>
                <RouterLink
                    to={`/entry/browse/${orgId}/${localTranslation.owner.replace(/\s/g, "__")}/${localTranslation.id}/${localTranslation.revision.replace(/\s/g, "__")}`}
                    style={{textDecoration: "none"}}> <Typography sx={{fontWeight: 'bold', textAlign: "center"}} variant="body1">
                    {localTranslation.title}
                </Typography>
                </RouterLink>
            </Grid>
            <Grid item xs={2}>
                <Typography variant="body2" sx={{textAlign: "right", fontWeight: "bold", fontSize: "x-small"}}>{canonStrings.join(', ')}</Typography>
                <Typography variant="body2" sx={{textAlign: "right", fontWeight: "bold", fontSize: "x-small"}}>{featureStrings.join(', ')}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
                <Typography variant="body2" sx={{textAlign: "right", fontSize: "x-small"}}>
                    ID {localTranslation.id}
                </Typography>
                <Typography variant="body2" sx={{textAlign: "right", fontSize: "x-small"}}>
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
    const so = searchTerms.org.trim().toLowerCase();
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
