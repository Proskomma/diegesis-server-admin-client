function searchClause(searchTerms) {

    const listifyTerms = ts => ts.trim().split(/\s+/).map(t => `"${t}"`).join(' ')

    return `(
        ${searchTerms.owner.trim().length > 0 ? `withOwner: [${listifyTerms(searchTerms.owner)}]` : ''}
        ${searchTerms.lang.trim().length > 0 ? `withLanguageCode: [${listifyTerms(searchTerms.lang)}]` : ''}
        ${searchTerms.text.trim().length > 0 ? `withMatchingMetadata: [${listifyTerms(searchTerms.text)}]` : ''}
        )`;
}

function searchQuery(query, searchTerms) {
    const trimmed = Object.entries(searchTerms).filter(kv => kv[0] !== 'org').map(kv => kv[1].trim());
   return query.replace(
           '%searchClause%',
           trimmed.filter(fl => fl.length > 0).length > 0  ?
               searchClause(searchTerms) :
               ''
       );
}

export { searchClause, searchQuery };
