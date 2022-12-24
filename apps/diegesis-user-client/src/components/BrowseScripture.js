import React, {useState, useEffect} from 'react';
import {Typography, Grid} from "@mui/material";

import {SofriaRenderFromProskomma} from "proskomma-json-tools";
import sofria2WebActions from '../transforms/sofria2html';
import DocSelector from "./DocSelector";

export default function BrowseScripture({pk}) {

    const [docId, setDocId] = useState(null);
    const [scriptureResult, setScriptureResult] = useState({});

    const docName = d => {
        return d.headers.filter(d => d.key === 'toc3')[0]?.value ||
            d.headers.filter(d => d.key === 'h')[0]?.value ||
            d.headers.filter(d => d.key === 'toc2')[0]?.value ||
            d.headers.filter(d => d.key === 'toc')[0]?.value ||
            d.headers.filter(d => d.key === 'bookCode')[0].value
    }

    useEffect(
        () => {
            const scriptureQuery = pk.gqlQuerySync(
                `{
               docSets {
                 documents(sortedBy:"paratext") {
                   id
                   headers { key value }
                 }
                 doc: documents(ids:"""%docId%""") {
                   mainBlocksText(normalizeSpace: true)
                 }
               }
            }`.replace(/%docId%/g, docId || "")
            );
            if (docId) {
                const renderer = new SofriaRenderFromProskomma({
                    proskomma: pk,
                    actions: sofria2WebActions,
                });

                const config = {};
                const output = {};

                try {
                    renderer.renderDocument(
                        {
                            docId,
                            config,
                            output,
                        },
                    );
                } catch (err) {
                    console.log(err);
                    throw err;
                }
                setScriptureResult({
                    query: scriptureQuery,
                    rendered: output.paras
                });
            } else {
                setScriptureResult({query: scriptureQuery});
            }
        },
        [docId]
    )

    const docMenuItems = scriptureResult.query && scriptureResult.query.data && scriptureResult.query.data.docSets && scriptureResult.query.data.docSets[0].documents ?
        scriptureResult.query.data.docSets[0].documents.map(d => ({id: d.id, label: docName(d)})) :
        [];

    return (
        <Grid container>
            <Grid item xs={12}>
                <DocSelector docs={docMenuItems} docId={docId} setDocId={setDocId}/>
            </Grid>
            <Grid item xs={12}>
                {
                    scriptureResult.rendered ?
                        <>{scriptureResult.rendered}</> :
                        <Typography>Please select a document from the menu above</Typography>
                }
            </Grid>
        </Grid>
    )
}
