import React from "react";
import LocalTab from "./LocalTab";

export default function TabbedBody({selectedOrg, searchLang, searchText}) {
    return <LocalTab selectedOrg={selectedOrg} searchLang={searchLang} searchText={searchText}/>;
}