import {Box, Typography} from '@mui/material';

export default function Footer() {
    const linkStyles = {
        color: "#FFF"
    }
    return <Box id="footer" sx={{backgroundColor: "primary.main", color: "#FFF", p: 3}}>
        <Typography variant="body2">{"Diegesis.Bible is an experiment by the Innovation Lab of "}
            <a href="http://eten.bible" target="_blank" rel="noreferrer" style={linkStyles}>Every Tribe Every Nation</a>,
            {" implemented by "}
            <a href="http://mvh.bible" target="_blank" rel="noreferrer" style={linkStyles}>MVH Solutions</a>
            {" using the "}
            <a href="http://doc.proskomma.bible" target="_blank" rel="noreferrer" style={linkStyles}>Proskomma Scripture Runtime Engine</a>.
        </Typography>
        <Typography variant="body2">© MVH Solutions 2022</Typography>
    </Box>
}
