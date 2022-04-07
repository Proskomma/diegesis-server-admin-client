# diegesis-server
An Apollo-based server that caches Scripture from remote sources and serves them via a unified GraphQL interface.

Diegesis Server can
currently interact with
- DBL
- DCS
- eBible
- Vachan2

For these sources it provides
- catalog information, with very basic metadata, about available content
- a mechanism to download USFM or USX for a particular translation
- conversion of USFM or USX to a Proskomma succinct JSON file for the entire docSet,
  either via an optional cron process or via an explicit GraphQL mutation
- augmented metadata for downloaded translations
- per-book USFM/USX via GraphQL
- per-translation succinct JSON via GraphQL

## Installation
### Locally
```
npm install
node src/index.js // most things disabled, listening on port 2468, OR
node src/index.js debug_example_config.json // Most things enabled, listening on port 1234
```

### Using Docker
#### Building
```
docker build -t proskomma/diegesis-server .
```
*Don't forget the final dot*

#### Running
```
docker run --rm -d -p 3060:2468 --name=diegesis-server proskomma/diegesis-server
```

* `--rm` removes container after use
* `-d` runs as daemon
* `-p 2468:2468` exposes container port 2468 on local port 3060

#### Stopping
```
docker stop diegesis-server
```

#### Monitoring
Overview
```
docker ps
```

Resource usage
```
docker stats
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
# translations(withUsx: true)
# translations(withLanguageCode: "fra" withUsfm: false)
# translations(withId: ["aak", "fraLSG"])
# translations(withLanguageCode: ["fra", "deu"])
# translations(withMatchingMetadata: "King")
# translations(sortedBy: "id")
# translations(sortedBy: "languageCode" reverse: true)

mutation Mutation {
  fetchUsfm(org: "eBible", translationId: "fraLSG") # or fetchUsx for DBL
}

# Then try org query again to see USFM

```

## Configuration
- See `example_config.json`

## Writing a new org handler
New org handlers go in `orgHandlers`

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
