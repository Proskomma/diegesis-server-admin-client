import {Container, Typography, Box} from "@mui/material";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HomePage() {

    return <Container fixed className="homepage">
        <Header selected="how"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>Diegesis Technology</Typography>
            <Typography variant="body1" paragraph="true">Diegesis is an open-source project. The source code is hosted
                on <a href="https://github.com/Proskomma/diegesis-monorepo">Github</a>. Internally, Diegesis makes
                extensive use of the <a href="http://doc.proskomma.bible" target="_blank" rel="noreferrer">Proskomma
                    Scripture Runtime Engine</a> to parse and process Scripture content.</Typography>
            <Footer/>
        </Box>
    </Container>;

}
