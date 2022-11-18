import {Box, Paper, Typography} from "@mui/material";
import React from "react";

export default function GqlError({error}) {
    return <Paper sx={{width: '100%', overflow: 'hidden'}}>
        {
            error.message === "Failed to fetch" ?
                <Box>
                    <Typography variant="h5">Failed to fetch</Typography>
                </Box> :
                <Box>
                    <Typography variant="h5">GraphQL Error</Typography>
                    <Typography 
                        sx={{ backgroundColor: "pink"}}
                    >
                        {JSON.stringify(error)}
                        </Typography>
                </Box>
        }
    </Paper>;
}
