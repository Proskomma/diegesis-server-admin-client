import React from "react";
import {AppBar, Box, TextField, Toolbar, Typography} from "@mui/material";
import PageMenu from "./PageMenu";

export default function Header({orgs, searchText, setSearchText, searchLang, setSearchLang, selectedOrgIndex, setSelectedOrgIndex}) {

    return <AppBar position="static">
        <Toolbar>
            <PageMenu orgs={orgs} selectedOrgIndex={selectedOrgIndex} setSelectedOrgIndex={setSelectedOrgIndex}/>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Diegesis</Typography>
            <Box
                sx={{
                    display: 'flex',
                    width: 500,
                    maxWidth: '100%',
                }}
            >
                <TextField
                    value={searchLang}
                    onChange={e => setSearchLang(e.target.value)}
                    label="Language"
                    size="small"
                    id="searchLanguage"
                    variant="filled"
                    color="secondary"
                    sx={{ backgroundColor: "#FFF", opacity: "0.7" }}
                />
                <TextField
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    label="Title"
                    size="small"
                    id="searchTitle"
                    variant="filled"
                    color="secondary"
                    sx={{ marginLeft: "2em", backgroundColor: "#FFF", opacity: "0.7" }}
                />
            </Box>
        </Toolbar>
    </AppBar>
}
