import {Container, Typography, Grid, Box, Button} from "@mui/material";
import {useParams, Link as RouterLink} from "react-router-dom";
import {ArrowBack} from '@mui/icons-material';

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function EntryDetailsPage() {

    const {source, owner, entryId, revision} = useParams();

    return <Container fixed className="homepage">
        <Header selected="list"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}><Button>
                <RouterLink to="/list"><ArrowBack/></RouterLink></Button> Entry Details</Typography>
            <Grid container>
                <Grid item xs={3}>
                    <Typography variant="h6" paragraph="true">Data Source</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="h6" paragraph="true">{source}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="h6" paragraph="true">Owner</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="h6" paragraph="true">{owner}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="h6" paragraph="true">Entry ID</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="h6" paragraph="true">{entryId}</Typography>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="h6" paragraph="true">Revision</Typography>
                </Grid>
                <Grid item xs={9}>
                    <Typography variant="h6" paragraph="true">{revision}</Typography>
                </Grid>
            </Grid>
            <Footer/>
        </Box>
    </Container>;

}
