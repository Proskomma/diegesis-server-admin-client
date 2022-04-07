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
```
npm install
node src/index.js // most things disabled, listening on port 2468, OR
node src/index.js debug_example_config.json // Most things enabled, listening on port 1234
```
See also the Docker documentation at the end of this document

## Overview of the GraphQL
### Queries
#### Organizations
The data sources from which Diegesis Server may cache content.
```
{orgs { name } }
```
#### Catalog Entries
Translations available from the organizations (which may or may not be cached locally).
```
{
  org(name: "eBible") {
    catalogEntries {
      id
      languageCode
      title
      hasLocalUsfm
      hasLocalUsx
      hasLocalSuccinct
    }
  }
}

{
  org(name: "eBible") {
    catalogEntries(withLanguageCode: ["fra", "eng"]) {
      id
    }
  }
}

# There are several other filter options for `catalogEntries`

{
  org(name: "eBible") {
    catalogEntry(id:"fraLSG") {
      id
    }
  }
}
```

#### Local Translations
Translations for which Scripture content plus additional metadata has been cached. The cached USFM or USX for a book may be read from a single endpoint. If succinct JSON has been generated (either via the cron process or via an explicit mutation), this can also be read from a single endpoint.
```
# Uninteresting until some translations have been cached using mutation or cron.
{
  org(name: "eBible") {
    localTranslations(withLanguageCode:"fra") {
      id
      textDirection
      script
      copyright
      abbreviation
      nUsfmBooks
      hasUsfmBookCode(code:"PHM")
      usfmForBookCode(code:"PHM")
      hasSuccinct
      succinct
    }
  }
}

{
  org(name: "eBible") {
    localTranslation(id:"fraLSG") {
      id
    }
  }
}
```

### Mutations
#### Fetch USFM/USX
```
mutation {
  fetchUsfm(org: "eBible", translationId: "fraLSG")
}

mutation {
  fetchUsx(org: "DBL", translationId: "de4e12af7f28f599")
}
```
#### Make Succinct
This may also happen via the cron, if configured.
```
mutation {
  makeSuccinct(org: "eBible", translationId: "fraLSG")
}
```

## Configuration
See
- `default_config.json` for the standard, prudent config
- `debug_config.json` for an 'everything enabled' config for debugging

## Writing a new org handler
New org handlers go in `orgHandlers`

Look at the `eBible` example. Your org handler directory should include
- JSON called `org.json` containing a unique `name` and `translationDir`.
- a module called `translations.js` that returns `getTranslationsCatalog`, `fetchUsfm` and `fetchUsx`

## Using Docker
### Building
```
docker build -t proskomma/diegesis-server .
# Copies default_config.json into container as default config
```
*Don't forget the final dot*

### Running
```
# With default config
docker run --rm -d -p 3060:2468 --name=diegesis-server proskomma/diegesis-server

# With supplied config (debug in this case)
# Note that the config file may change the listening port which must then be mapped using
# -p when docker is run
docker run -d -p 3060:1234 -v /my/absolute/path/to/debug_config.json:/app/config.json --name=diegesis-server proskomma/diegesis-server
```
* `--rm` removes container after use
* `-d` runs as daemon
* `-p 3060:1234` exposes container port 2468 on local port 3060

### Stopping
```
docker stop diegesis-server
```

### Removing (when --rm option not used to run)
```
docker rm diegesis-server
```

### Error log (when --rm option not used to run)
```
docker logs diegesis-server
```

### Monitoring
####Overview
```
docker ps
```

####Resource usage
```
docker stats
```

