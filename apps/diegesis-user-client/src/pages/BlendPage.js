import {Container, Typography, Box} from "@mui/material";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BlendPage() {

    return <Container fixed className="homepage">
        <Header selected="mix"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>Blend Your Data</Typography>
            <Footer/>
        </Box>
    </Container>;

}
