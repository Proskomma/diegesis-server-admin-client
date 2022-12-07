import {Container, Typography, Grid, Box, Button} from "@mui/material";
import {useParams, Link as RouterLink} from "react-router-dom";
import {ArrowBack} from '@mui/icons-material';
import {gql, useQuery} from "@apollo/client";
import GqlError from "../components/GqlError";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";

export default function EntryDetailsPage() {

    const {source, owner, entryId, revision} = useParams();

    const queryString =
        `query {
          org(name:"""%source%""") {
            localTranslation(
              owner: """%owner%"""
              id: """%entryId%"""
              revision: """%revision%"""
            ) {
              languageCode
              title
            }
          }
        }`
            .replace("%source%", source)
            .replace("%owner%", owner)
            .replace("%entryId%", entryId)
            .replace("%revision%", revision);

    const {loading, error, data} = useQuery(
        gql`${queryString}`,
    );

    if (loading) {
        return <Spinner/>
    }
    if (error) {
        return <GqlError error={error}/>
    }

    const translationInfo = data.org.localTranslation;

    return <Container fixed className="homepage">
        <Header selected="list"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>
                <Button>
                    <RouterLink to="/list"><ArrowBack/></RouterLink></Button>
                {translationInfo.title}
            </Typography>
            <Typography variant="h5" paragraph="true">Details</Typography>
            <Grid container>
                <Grid item xs={3}>
                    <Typography variant="body1" paragraph="true">Language</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="body1" paragraph="true">{translationInfo.languageCode}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="body1" paragraph="true">Data Source</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="body1" paragraph="true">{source}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="body1" paragraph="true">Owner</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="body1" paragraph="true">{owner}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="body1" paragraph="true">Entry ID</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="body1" paragraph="true">{entryId}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="body1" paragraph="true">Revision</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="body1" paragraph="true">{revision}</Typography>
                </Grid>
            </Grid>
            <Footer/>
        </Box>
    </Container>;

}
