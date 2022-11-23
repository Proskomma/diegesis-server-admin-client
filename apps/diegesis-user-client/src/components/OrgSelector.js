import { Select, MenuItem } from "@mui/material";

export default function OrgSelector({orgs, searchOrg, setSearchOrg}) {

    return (
        <Select
            id="org_selector"
            value={searchOrg}
            label="Organization"
            size="small"
            color="primary"
            sx={{ marginRight: "1em", backgroundColor: "#FFF"}}
            onChange={(event) => setSearchOrg(event.target.value)}
        >
            <MenuItem
                key="all"
                value="all"
            >
                All Orgs
            </MenuItem>
            {orgs.map((option, index) => (
                <MenuItem
                    key={option}
                    value={option}
                >
                    {option}
                </MenuItem>
            ))}

        </Select>
    )
}
