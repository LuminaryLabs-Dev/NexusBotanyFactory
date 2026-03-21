# Runtime Modes

There are two distinct runtime modes in the repo.

## 1. Static/browser mode

Purpose:

- GitHub Pages deployment
- browser-local persistence
- no live REST dependency

Key files:

- `next.config.js`
- `src/lib/api-client.js`
- `src/lib/providers/browserProvider.js`
- `src/lib/browser/assetStore.js`
- `src/lib/browser/presetStore.js`

Observed status:

- functional
- UI loads
- phenotype buttons render
- custom specimen catalog renders
- library save/load works in browser storage

Evidence:

- `evidence/static/build.png`
- `evidence/static/editor.png`
- `evidence/static/library.png`
- `evidence/static/library-after-save.png`
- `evidence/static/ui-report.json`

## 2. Dev-stack REST mode

Purpose:

- local Next dev app
- external REST validation
- SQLite-backed persistence

Key files:

- `scripts/dev-stack.mjs`
- `src/server/runtime/dev-server.js`
- `src/lib/providers/restProvider.js`

Observed status:

- broken by configuration in the current environment
- the web app is pointed at `http://localhost:3002/api`
- the Nexus API binds to `127.0.0.1:3002`
- port `3002` is already occupied by a different service on this machine

Practical outcome:

- presets fail to load
- assets fail to load
- custom catalog fails to load
- Build view renders without phenotype buttons
- browser console shows CORS/fetch failures

Evidence:

- `evidence/dev/ui-report.json`
- `evidence/dev/build.png`

## Audit conclusion

The application has a real split-brain runtime model:

- shipped app behavior is based on browser-local storage
- dev REST behavior is a different persistence system
- the local developer experience is fragile because the API base URL and API bind host/port assumptions are not aligned
