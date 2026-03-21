# Library and Persistence Audit

Key files:

- `src/views/editor/LibraryPanel.jsx`
- `src/lib/browser/assetStore.js`
- `src/lib/providers/browserProvider.js`
- `src/server/repositories/assetRepository.js`
- `src/server/db/sqlite.js`

## Two persistence systems exist

### Browser/localStorage

- used by the shipped static app
- asset store key: `nexus-botany-factory.assets.v4`
- persistence lives entirely in the browser

### SQLite

- used by the standalone REST server
- database path comes from `src/server/db/sqlite.js`
- file path observed through capabilities:
  - `.data/botany-factory.sqlite`

## Working in static/browser mode

- `Library` opens as its own full-width workspace
- empty state renders correctly before save
- clicking `Save` adds the current specimen to the library
- after save, a loadable specimen card appears

Evidence:

- `evidence/static/library.png`
- `evidence/static/library-after-save.png`
- `evidence/static/library-after-save.json`

## Working in isolated REST mode

- list assets
- create asset
- get asset
- patch asset
- duplicate asset
- delete asset

Evidence:

- `evidence/dev/rest-report.json`

## Gaps

- the UI runtime does not unify browser-local and SQLite assets
- dev-stack REST mode and static/browser mode do not show the same library contents
- the current user experience makes it easy to think the library is broken, when the real issue is that two distinct stores are in use

## Conclusion

Both persistence systems work independently. The weakness is runtime coherence, not raw CRUD implementation.
