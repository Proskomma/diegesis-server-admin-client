import React, {useState, useEffect} from 'react';
import {Typography, Grid, Switch, FormGroup, FormControlLabel, Box, Button} from "@mui/material";
import {Tune} from '@mui/icons-material';
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
        showTitles: true,
        showHeadings: true,
        showIntroductions: true,
        showFootnotes: true,
        showXrefs: true,
        showParaStyles: true,
        showCharacterMarkup: true,
        showChapterLabels: true,
        showVersesLabels: true,
        updatedAtts: false,
    });

    const [showSettings, setShowSettings] = useState(false);

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
                    showWordAtts: scriptureData.showWordAtts,
                    showTitles: scriptureData.showTitles,
                    showHeadings: scriptureData.showHeadings,
                    showIntroductions: scriptureData.showIntroductions,
                    showFootnotes: scriptureData.showFootnotes,
                    showXrefs: scriptureData.showXrefs,
                    showParaStyles: scriptureData.showParaStyles,
                    showCharacterMarkup: scriptureData.showCharacterMarkup,
                    showChapterLabels: scriptureData.showChapterLabels,
                    showVersesLabels: scriptureData.showVersesLabels
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
    const toggleTitles = () => setScriptureData({
        ...scriptureData,
        showTitles: !scriptureData.showTitles,
        updatedAtts: true
    });
    const toggleHeadings = () => setScriptureData({
        ...scriptureData,
        showHeadings: !scriptureData.showHeadings,
        updatedAtts: true
    });
    const toggleIntroductions = () => setScriptureData({
        ...scriptureData,
        showIntroductions: !scriptureData.showIntroductions,
        updatedAtts: true
    });
    const toggleFootnotes = () => setScriptureData({
        ...scriptureData,
        showFootnotes: !scriptureData.showFootnotes,
        updatedAtts: true
    });
    const toggleXrefs = () => setScriptureData({
        ...scriptureData,
        showXrefs: !scriptureData.showXrefs,
        updatedAtts: true
    });
    const toggleParaStyles = () => setScriptureData({
        ...scriptureData,
        showParaStyles: !scriptureData.showParaStyles,
        updatedAtts: true
    });
    const toggleCharacterMarkup = () => setScriptureData({
        ...scriptureData,
        showCharacterMarkup: !scriptureData.showCharacterMarkup,
        updatedAtts: true
    });
    const toggleChapterLabels = () => setScriptureData({
        ...scriptureData,
        showChapterLabels: !scriptureData.showChapterLabels,
        updatedAtts: true
    });
    const toggleVersesLabels = () => setScriptureData({
        ...scriptureData,
        showVersesLabels: !scriptureData.showVersesLabels,
        updatedAtts: true
    });

    return (
        <Grid container>
            <Grid item xs={12} sm={6} md={4} lg={2}>
                <Box sx={{marginRight: "5px"}}>
                    <FormGroup sx={{padding: "10px", backgroundColor: showSettings ? "#ccc" : "inherit"}}>
                        <Button
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <Tune />
                        </Button>
                        {
                            showSettings &&
                            <>
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showTitles}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleTitles()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Titles"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showHeadings}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleHeadings()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Headings"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showIntroductions}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleIntroductions()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Introductions"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showFootnotes}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleFootnotes()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Footnotes"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showXrefs}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleXrefs()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Cross Refs"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showParaStyles}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleParaStyles()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Para Styles"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showCharacterMarkup}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleCharacterMarkup()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Char Styles"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showChapterLabels}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleChapterLabels()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Chapter N°s"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showVersesLabels}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleVersesLabels()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Verse N°s"
                                />
                                <FormControlLabel
                                    control={<Switch
                                        checked={scriptureData.showWordAtts}
                                        color="secondary"
                                        size="small"
                                        onChange={() => toggleWordAtts()}
                                        inputProps={{'aria-label': 'controlled'}}
                                        disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                                    />}
                                    label="Word Info"
                                />
                            </>
                        }
                    </FormGroup>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={8} lg={10}>
                <DocSelector
                    docs={docMenuItems}
                    docId={scriptureData.docId}
                    setDocId={setDocId}
                    disabled={!scriptureData.rendered || scriptureData.docId !== scriptureData.renderedDocId || scriptureData.updatedAtts}
                />
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
