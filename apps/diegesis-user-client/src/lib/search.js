function searchClause(searchTerms) {

    const listifyTerms = ts => ts.trim().split(/\s+/).map(t => `"${t}"`).join(' ');
    const featuresString = f => Object.entries(searchTerms.features)
        .filter(kv => kv[1])
        .map(kv => kv[0])
        .map(f => `"${f}"`).join(' ');

    return `(
        ${searchTerms.owner.trim().length > 0 ? `withOwner: [${listifyTerms(searchTerms.owner)}]` : ''}
        ${searchTerms.lang.trim().length > 0 ? `withLanguageCode: [${listifyTerms(searchTerms.lang)}]` : ''}
        ${searchTerms.text.trim().length > 0 ? `withMatchingMetadata: [${listifyTerms(searchTerms.text)}]` : ''}
        ${featuresString.length > 0 ? `withFeatures: [${featuresString(searchTerms.features)}]` : ""}
        )`;
}

function searchQuery(query, searchTerms) {
    const trimmed = Object.entries(searchTerms).filter(kv => kv[0] !== 'org' && kv[0] !== 'features').map(kv => kv[1].trim());
    const setFeatures = Object.entries(searchTerms.features).filter(kv => kv[1]);
   return query.replace(
           '%searchClause%',
           trimmed.filter(fl => fl.length > 0).length > 0 || setFeatures.length > 0 ?
               searchClause(searchTerms) :
               ''
       );
}

export { searchClause, searchQuery };
