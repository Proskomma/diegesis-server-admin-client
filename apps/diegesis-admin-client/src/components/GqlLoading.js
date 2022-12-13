import {Box, Paper, Typography} from "@mui/material";
import React from "react";

export default function GqlLoading() {
    return <Paper sx={{width: '100%', overflow: 'hidden'}}>
        <Box>
            <Typography variant="h5">Loading</Typography>
        </Box>
    </Paper>;
}
