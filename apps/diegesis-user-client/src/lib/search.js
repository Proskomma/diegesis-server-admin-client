function searchClause(searchLang, searchText) {

    const listifyTerms = ts => ts.trim().split(/\s+/).map(t => `"${t}"`).join(' ')

    return `(
        ${searchLang.trim().length > 0 ? `withLanguageCode: [${listifyTerms(searchLang)}]` : ''}
        ${searchText.trim().length > 0 ? `withMatchingMetadata: [${listifyTerms(searchText)}]` : ''}
        )`;
}

function searchQuery(query, org, searchLang, searchText) {
   return query.replace('%org%', org)
       .replace(
           '%searchClause%',
           searchText.trim().length > 0 || searchLang.trim().length > 0 ?
               searchClause(searchLang, searchText) :
               ''
       );
}

export { searchClause, searchQuery };
