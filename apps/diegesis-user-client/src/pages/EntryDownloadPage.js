import {Container, Typography, Box, Button} from "@mui/material";
import {Link as RouterLink, useParams} from "react-router-dom";
import {ArrowBack} from '@mui/icons-material';

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function EntryDownloadPage() {

    const {orgId, entryId} = useParams();

    return <Container fixed className="homepage">
        <Header selected="list"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}><Button>
                <RouterLink to="/list"><ArrowBack/></RouterLink></Button>Entry Downloads</Typography>
            <Typography variant="h6" paragraph="true">{orgId} {entryId}</Typography>
            <Footer/>
        </Box>
    </Container>;

}
