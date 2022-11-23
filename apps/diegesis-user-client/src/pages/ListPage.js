import Header from "../components/Header";
import ListView from "../components/ListView";
import Spinner from "../components/Spinner";
import Footer from "../components/Footer";
import {Container, Box, Toolbar, TextField, Typography} from "@mui/material";
import OrgSelector from "../components/OrgSelector";

export default function ListPage({
                                     orgs,
                                     searchOrg,
                                     setSearchOrg,
                                     searchLang,
                                     setSearchLang,
                                     searchText,
                                     setSearchText
                                 }) {
    return <Container fixed className="listpage">
        <Header selected="list">
            <Toolbar>
                <Box
                    sx={{
                        display: 'flex',
                        width: 500,
                        maxWidth: '100%',
                    }}
                >
                    <OrgSelector
                        orgs={orgs}
                        searchOrg={searchOrg}
                        setSearchOrg={setSearchOrg}
                        sx={{marginRight: "1em"}}
                    />
                    <TextField
                        value={searchLang}
                        onChange={e => setSearchLang(e.target.value)}
                        label="Language"
                        size="small"
                        id="searchLanguage"
                        variant="filled"
                        color="primary"
                        sx={{marginRight: "1em", backgroundColor: "#FFF", display: 'flex'}}
                    />
                    <TextField
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        label="Title"
                        size="small"
                        id="searchTitle"
                        variant="filled"
                        color="primary"
                        sx={{marginRight: "1em", backgroundColor: "#FFF", display: 'flex'}}
                    />
                </Box>
            </Toolbar>
        </Header>
        <Box id="body">
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>Biblical Resources on Diegesis</Typography>
            {orgs.length > 0 ?
                <ListView searchOrg={searchOrg} searchLang={searchLang} searchText={searchText}/>
                :
                <Spinner/>
            }
        </Box>
        <Footer/>
    </Container>
}
