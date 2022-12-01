import {Container, Typography, Box, Button} from "@mui/material";
import {useParams, Link as RouterLink} from "react-router-dom";
import {ArrowBack} from '@mui/icons-material';

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function EntryDetailsPage() {

    const {orgId, entryId} = useParams();

    return <Container fixed className="homepage">
        <Header selected="list"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}><Button>
                <RouterLink to="/list"><ArrowBack/></RouterLink></Button> Details</Typography>
            <Typography variant="h6" paragraph="true">{orgId} {entryId}</Typography>
            <Footer/>
        </Box>
    </Container>;

}
