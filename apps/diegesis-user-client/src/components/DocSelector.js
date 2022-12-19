import { Select, MenuItem } from "@mui/material";

export default function DocSelector({docs, docId, setDocId}) {

    return (
        <Select
            id="doc_selector"
            value={docId || "pleaseChoose"}
            label="Document"
            size="small"
            color="primary"
            sx={{ marginRight: "1em", backgroundColor: "#FFF"}}
            onChange={(event) => setDocId(event.target.value)}
        >
            <MenuItem
                key={-1}
                value={"pleaseChoose"}
            >
                --
            </MenuItem>
            {docs.map((doc, index) => (
                <MenuItem
                    key={index}
                    value={doc.id}
                >
                    {doc.label}
                </MenuItem>
            ))}

        </Select>
    )
}
