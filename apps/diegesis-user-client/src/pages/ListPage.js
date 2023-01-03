import React, {useState, useEffect, useMemo} from 'react';
import {
    ApolloClient,
    gql,
    InMemoryCache,
} from "@apollo/client";
import {Container, Box, Grid, TextField, Typography, Checkbox, FormGroup, FormControlLabel, Button} from "@mui/material";
import {Tune} from '@mui/icons-material';
import Header from "../components/Header";
import ListView from "../components/ListView";
import Spinner from "../components/Spinner";
import Footer from "../components/Footer";
import OrgSelector from "../components/OrgSelector";

export default function ListPage({}) {
    const [searchOrg, setSearchOrg] = useState('all');
    const [searchOwner, setSearchOwner] = useState('');
    const [searchLang, setSearchLang] = useState('');
    const [searchText, setSearchText] = useState('');
    const [orgs, setOrgs] = useState([]);
    const [features, setFeatures] = useState({
        introductions: false,
        headings: false,
        footnotes: false,
        xrefs: false,
        strong: false,
        lemma: false,
        gloss: false,
        content: false,
        occurrences: false
    });
    const [showSettings, setShowSettings] = useState(false);

    const client = new ApolloClient(
        {
            uri: '/graphql',
            cache: new InMemoryCache(),
        }
    );

    const memoClient = useMemo(() => client);

    // This piece runs once, when the page is rendered
    useEffect(
        () => {
            const doOrgs = async () => {
                const result = await memoClient.query({query: gql`{ orgs { id: name } }`});
                setOrgs(result.data.orgs.map(o => o.id));
            };
            doOrgs();
        },
        []
    );

    return <Container fixed className="listpage">
        <Header selected="list">
        </Header>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>
                Resources
                <Button onClick={() => setShowSettings(!showSettings)}>
                    <Tune />
                </Button>
            </Typography>
            {
                showSettings &&
                <Grid container>
                    <Grid item xs={12} sm={6} md={3} sx={{paddingBottom: "15px"}}>
                        <OrgSelector
                            orgs={orgs}
                            searchOrg={searchOrg}
                            setSearchOrg={setSearchOrg}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            value={searchOwner}
                            onChange={e => setSearchOwner(e.target.value)}
                            label="Owner"
                            size="small"
                            id="searchOwner"
                            variant="filled"
                            color="primary"
                            sx={{display: 'flex', marginLeft: "1em"}}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            value={searchLang}
                            onChange={e => setSearchLang(e.target.value)}
                            label="Language"
                            size="small"
                            id="searchLanguage"
                            variant="filled"
                            color="primary"
                            sx={{display: 'flex', marginLeft: "1em"}}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            label="Title"
                            size="small"
                            id="searchTitle"
                            variant="filled"
                            color="primary"
                            sx={{display: 'flex', marginLeft: "1em"}}
                        />
                    </Grid>
                    {
                        [
                            ["Intro", "introductions"],
                            ["Heading", "headings"],
                            ["Footnote", "footnotes"],
                            ["Xref", "xrefs"],
                            ["Strong", "strong"],
                            ["Lemma", "lemma"],
                            ["Gloss", "gloss"],
                            ["Content", "content"],
                            ["Occurrence", "occurrences"],
                        ].map(
                            i =>
                                <Grid item xs={6} sm={4} md={1}>
                                    <FormGroup>
                                        <FormControlLabel
                                            labelPlacement="bottom"
                                            control={
                                                <Checkbox
                                                    checked={features[i[1]]}
                                                    size="small"
                                                    color="primary"
                                                    onChange={
                                                        () => {
                                                            const nf = {...features};
                                                            nf[i[1]] = !nf[i[1]];
                                                            setFeatures(nf);
                                                        }
                                                    }
                                                />
                                            }
                                            label={i[0]}
                                        />
                                    </FormGroup>
                                </Grid>
                        )
                    }
                </Grid>
            }
        </Box>
        <Box style={{marginTop: "20px"}}>
            {orgs.length > 0 ?
                <ListView searchTerms={{
                    org: searchOrg,
                    owner: searchOwner,
                    lang: searchLang,
                    text: searchText,
                    features: features,
                }}/>
                :
                <Spinner/>
            }
        </Box>
        <Footer/>
    </Container>
}
