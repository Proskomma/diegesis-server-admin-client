import React, {useState, useEffect} from 'react';
import {Typography, Grid, Button} from "@mui/material";

import DocSelector from "./DocSelector";

export default function BrowseScripture({pk}) {

    const [docId, setDocId] = useState(null);
    const [scriptureResult, setScriptureResult] = useState({});

    const docName = d => {
        return d.headers.filter(d => d.key === 'bookCode')[0].value;
    }

    useEffect(
        () =>
            setScriptureResult(
                pk.gqlQuerySync(
                    `{
               docSets {
                 documents {
                   id
                   headers { key value }
                 }
                 doc: documents(ids:"""%docId%""") {
                   mainBlocksText(normalizeSpace: true)
                 }
               }
            }`.replace(/%docId%/g, docId || "")
                )
            ),
        [docId]
    )

    const docMenuItems = scriptureResult.data && scriptureResult.data.docSets && scriptureResult.data.docSets[0].documents ?
        scriptureResult.data.docSets[0].documents.map(d => ({id: d.id, label: docName(d)})) :
        [];

    const firstDocItem = docMenuItems[0] || {};

    return (
        <Grid container>
            <Grid item xs={12}>
                <DocSelector docs={docMenuItems} docId={docId} setDocId={setDocId}/>
            </Grid>
            <Grid item xs={12}>
                {
                    (scriptureResult.data && scriptureResult.data.docSets && scriptureResult.data.docSets[0].doc && scriptureResult.data.docSets[0].doc[0]) ?
                        scriptureResult.data.docSets[0].doc[0].mainBlocksText.map(
                            bt =>
                                <Typography sx={{mb: 2}}>{bt}</Typography>
                        ) :
                        <Typography>Please select a document from the menu above</Typography>
                }
            </Grid>
        </Grid>
    )
}
