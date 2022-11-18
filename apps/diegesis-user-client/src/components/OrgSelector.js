import { Select, MenuItem } from "@mui/material";

export default function OrgSelector({orgs, selectedOrgIndex, setSelectedOrgIndex}) {

    return (
        <Select
            id="org_selector"
            value={selectedOrgIndex}
            label="Organization"
            size="small"
            color="primary"
            sx={{ marginLeft: "1em", backgroundColor: "#ffffff"}}
            onChange={(event) => setSelectedOrgIndex(event.target.value)}
        >
            {orgs.map((option, index) => (
                    <MenuItem
                        key={option}
                        value={index}
                    >
                        {option}
                    </MenuItem>
                ))}

        </Select>
    )
}
