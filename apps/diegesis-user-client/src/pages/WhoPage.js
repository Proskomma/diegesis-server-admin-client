import {Container, Typography, Box} from "@mui/material";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function WhoPage() {

    const indentSx = {
        ml: 3
    };

    return <Container fixed className="whopage">
        <Header selected="who"/>
        <Box style={{marginTop: "100px"}}>
            <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>Who's behind Diegesis?</Typography>
            <Typography variant="h6" paragraph="true">The Data</Typography>
            <Typography variant="body1" paragraph="true">Diegesis pulls data from a number of major open-access archives
                including:</Typography>
            <Typography variant="body1" paragraph="true" sx={indentSx}>- The Digital Bible Library</Typography>
            <Typography variant="body1" paragraph="true" sx={indentSx}>- Door 43</Typography>
            <Typography variant="body1" paragraph="true" sx={indentSx}>- eBible</Typography>
            <Typography variant="body1" paragraph="true" sx={indentSx}>- Vachan</Typography>
            <Typography variant="h6" paragraph="true">The Software</Typography>
            <Typography variant="body1" paragraph="true">The Diegesis project is led by Mark Howe from <a
                href="http://mvh.bible" target="_blank" rel="noreferrer">MVH Solutions</a>.</Typography>
            <Footer/>
        </Box>
    </Container>;

}
