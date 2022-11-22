import React from "react";
import { AppBar, Box, TextField, Toolbar, Typography } from "@mui/material";

export default function Header({orgs, searchText, setSearchText, searchLang, setSearchLang, searchOrg, setSearchOrg}) {

    return <AppBar position="static">
        <Toolbar>
            <Typography variant="h6">Diegesis - Creative Commons Scripture Content</Typography>
        </Toolbar>
        <Toolbar>
            <Box
                sx={{
                    display: 'flex',
                    width: 500,
                    maxWidth: '100%',
                }}
            >
                <TextField
                    value={searchOrg}
                    onChange={e => setSearchOrg(e.target.value)}
                    label="Org"
                    size="small"
                    id="searchOrg"
                    variant="filled"
                    color="primary"
                    sx={{ marginRight: "1em", backgroundColor: "#FFF", display: 'flex'}}
                />
                <TextField
                    value={searchLang}
                    onChange={e => setSearchLang(e.target.value)}
                    label="Language"
                    size="small"
                    id="searchLanguage"
                    variant="filled"
                    color="primary"
                    sx={{ marginRight: "1em", backgroundColor: "#FFF", display: 'flex'}}
                />
                <TextField
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    label="Title"
                    size="small"
                    id="searchTitle"
                    variant="filled"
                    color="primary"
                    sx={{ marginRight: "1em", backgroundColor: "#FFF", display: 'flex'}}
                />
            </Box>
        </Toolbar>
    </AppBar>
}
