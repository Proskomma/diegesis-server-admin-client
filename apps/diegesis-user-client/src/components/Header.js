import React from "react";
import { AppBar, Box, TextField, Toolbar, Typography } from "@mui/material";
import OrgSelector from "./OrgSelector";

export default function Header({orgs, searchText, setSearchText, searchLang, setSearchLang, selectedOrgIndex, setSelectedOrgIndex}) {

    return <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Diegesis Dashboard</Typography>
            <Box
                sx={{
                    display: 'flex',
                    width: 500,
                    maxWidth: '100%',
                }}
            >
                <OrgSelector orgs={orgs} selectedOrgIndex={selectedOrgIndex} setSelectedOrgIndex={setSelectedOrgIndex} />

                <TextField
                    value={searchLang}
                    onChange={e => setSearchLang(e.target.value)}
                    label="Language"
                    size="small"
                    id="searchLanguage"
                    variant="filled"
                    color="primary"
                    sx={{ marginLeft: "1em", backgroundColor: "#FFF"}}
                />
                <TextField
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    label="Title"
                    size="small"
                    id="searchTitle"
                    variant="filled"
                    color="primary"
                    sx={{ marginLeft: "1em", backgroundColor: "#FFF"}}
                />
            </Box>
        </Toolbar>
    </AppBar>
}
