# diegesis-server
An Apollo-based Server that Caches Scripture from Remote Sources and Serves Them via a Unified GraphQL Interface.

## Installation
### Locally
```
npm install
cd src
node index.js
```
### Using Docker
```
docker build --no-cache -t proskomma/diegesis-server .  # Don't forget the final dot
docker run --rm -d -p 2468:2468 --name=diegesis-server proskomma/diegesis-server .
# --rm removes container after use
# -d runs as daemon
# -p 2468:2468 exposed container port 2468 on local port 2468
// 'docker stats' to check that it's running
// 'docker stop diegesis-server' to stop it
```

## Some GraphQL to try
```
{orgs { name } }

{org(name:"eBible") { nTranslations } }

{
  org(name: "eBible") {
    name
    nTranslations
    translation(id:"fraLSG") {
      id
      languageCode
      languageName
      title
      description
      copyright
      nUsfmBooks
      hasUsfm
      usfmForBookCode(code:"MAT")
     }
  }
}

# translations(withUsfm: true)
# translations(withLanguageCode: "fra" withUsfm: false)
# translations(withId: ["aak", "fraLSG"])
# translations(withLanguageCode: ["fra", "deu"])
# translations(withMatchingMetadata: "King")
# translations(sortedBy: "id")
# translations(sortedBy: "languageCode" reverse: true)

mutation Mutation {
  fetchUsfm(org: "eBible", translationId: "fraLSG")
}

# Then try org query again to see USFM

```

## Configuration
- There are few constants at the top of `src/index.js`
- New org handlers go in `orgHandlers`

## Writing a new org handler
Look at the `eBible` example. Your org handler directory should include
- JSON called `org.json` containing a unique `name` and `translationDir`.
- a module called `translations.js` that returns `getTranslationsCatalog` and `fetchUsfm`

The catalog representation produced by `getTranslationsCatalog` is currently very simple, to make adoption by multiple organizations as painless as posssible. The required fields are
- id
- languageCode
- languageName
- title
- description
- copyright
