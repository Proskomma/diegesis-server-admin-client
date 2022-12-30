import React, {useState, useEffect} from 'react';
import {Typography, Grid, Switch, FormGroup, FormControlLabel} from "@mui/material";

import {SofriaRenderFromProskomma} from "proskomma-json-tools";
import sofria2WebActions from '../renderer/sofria2web';
import DocSelector from "./DocSelector";

export default function BrowseScripture({pk}) {

    const [scriptureData, setScriptureData] = useState({
        docId: null,
        menuQuery: null,
        renderedDocId: null,
        rendered: null,
        showWordAtts: false,
        updatedAtts: false,
    });

    const docName = d => {
        return d.headers.filter(d => d.key === 'toc3')[0]?.value ||
            d.headers.filter(d => d.key === 'h')[0]?.value ||
            d.headers.filter(d => d.key === 'toc2')[0]?.value ||
            d.headers.filter(d => d.key === 'toc')[0]?.value ||
            d.headers.filter(d => d.key === 'bookCode')[0].value
    }

    useEffect(
        () => {
            let newDocId;
            let menuQuery = scriptureData.menuQuery;
            if (!scriptureData.docId) {
                menuQuery = pk.gqlQuerySync(
                    `{
               docSets {
                 documents(sortedBy:"paratext") {
                   id
                   headers { key value }
                 }
               }
            }`
                );
                newDocId = menuQuery.data.docSets[0].documents[0].id;
            } else {
                newDocId = scriptureData.docId;
            }
            if (newDocId !== scriptureData.renderedDocId || scriptureData.updatedAtts) {
                const renderer = new SofriaRenderFromProskomma({
                    proskomma: pk,
                    actions: sofria2WebActions,
                });

                const config = {
                    showWordAtts: scriptureData.showWordAtts
                };
                const output = {};
                try {
                    renderer.renderDocument(
                        {
                            docId: newDocId,
                            config,
                            output,
                        },
                    );
                } catch (err) {
                    console.log("Renderer", err);
                    throw err;
                }
                setScriptureData({
                    ...scriptureData,
                    docId: newDocId,
                    renderedDocId: newDocId,
                    menuQuery,
                    rendered: output.paras,
                    updatedAtts: false,
                });
            }
        },
        [scriptureData]
    )

    const docMenuItems = scriptureData.menuQuery && scriptureData.menuQuery.data && scriptureData.menuQuery.data.docSets && scriptureData.menuQuery.data.docSets[0].documents ?
        scriptureData.menuQuery.data.docSets[0].documents.map(d => ({id: d.id, label: docName(d)})) :
        [];

    const setDocId = newId => setScriptureData({...scriptureData, docId: newId});
    const toggleWordAtts = () => setScriptureData({
        ...scriptureData,
        showWordAtts: !scriptureData.showWordAtts,
        updatedAtts: true
    });

    return (
        <Grid container>
            <Grid item xs={12} sm={6} md={4} lg={2}>
                <DocSelector
                    docs={docMenuItems}
                    docId={scriptureData.docId}
                    setDocId={setDocId}
                    disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={8} lg={10}>
                <FormGroup>
                    <FormControlLabel
                        control={<Switch
                            checked={scriptureData.showWordAtts}
                            size="small"
                            onChange={() => toggleWordAtts()}
                            inputProps={{'aria-label': 'controlled'}}
                            disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                        />}
                        label="Word Info"
                    />
                </FormGroup>
            </Grid>
            <Grid item xs={12}>
                {
                    scriptureData.rendered && scriptureData.docId === scriptureData.renderedDocId ?
                        <>{scriptureData.rendered}</> :
                        <Typography>Loading...</Typography>
                }
            </Grid>
        </Grid>
    )
}
