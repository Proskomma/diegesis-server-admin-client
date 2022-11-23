import React from "react";
import {Link as RouterLink} from "react-router-dom";
import { AppBar, Toolbar, Box } from "@mui/material";
import {Home, Engineering, Dataset, Diversity3} from '@mui/icons-material';

export default function Header({selected, children}) {

    const linkBoxStyles = {
        m: 3,
    }

    const selectedLinkStyles = {
        color: "#fff"
    }

    const linkStyles = {
        color: "#999"
    }

    return <AppBar position="static">
        <Toolbar>
            <RouterLink to="/"><Box sx={linkBoxStyles}><Home  sx={selected === 'home'? selectedLinkStyles : linkStyles}/></Box></RouterLink>
            <RouterLink to="/who"><Box sx={linkBoxStyles}><Diversity3 sx={selected === 'who'? selectedLinkStyles : linkStyles}/></Box></RouterLink>
            <RouterLink to="/how"><Box sx={linkBoxStyles}><Engineering sx={selected === 'how'? selectedLinkStyles : linkStyles}/></Box></RouterLink>
            <RouterLink to="/list"><Box sx={linkBoxStyles}><Dataset sx={selected === 'list'? selectedLinkStyles : linkStyles}/></Box></RouterLink>
        </Toolbar>
        {children}
    </AppBar>
}
