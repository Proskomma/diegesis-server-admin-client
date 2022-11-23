import {Container, Typography} from "@mui/material";
import {Link} from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HomePage() {

    return <Container fixed className="homepage">
        <Header selected="home"/>
        <Typography variant="h4" paragraph="true" sx={{mt: "20px"}}>Diegesis</Typography>
        <Typography variant="h6" paragraph="true">Creative Commons Scripture Resources to Go!</Typography>
        <Typography variant="body1" paragraph="true">Diegesis is a place to find Bibles and related resources, in a
            variety of formats, released under open licences. (In other words, you can use, share, improve and translate
            them.)</Typography>
        <Typography variant="body1" paragraph="true">You can see the content <Link to="/list">here</Link>.</Typography>
        <Footer/>
    </Container>;

}
