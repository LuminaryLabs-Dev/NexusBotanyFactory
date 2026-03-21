# Broken Findings

This file lists the main broken or risky areas found during the audit.

## 1. Dev stack points the web app at the wrong REST target

Severity: high

Files:

- `scripts/dev-stack.mjs`
- `src/lib/providers/restProvider.js`

Observed behavior:

- dev web app uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002/api`
- Nexus API binds to `127.0.0.1:3002`
- on this machine, `localhost:3002` is a different service

User-visible effect:

- empty phenotype picker
- empty library
- empty custom catalog
- fetch/CORS failures in browser console

Evidence:

- `evidence/dev/ui-report.json`

## 2. `POST /api/build/validate` is broken

Severity: high

Files:

- `src/server/http/build-handlers.js`
- `src/models/botany/validation/validation.js`

Observed behavior:

- returns `500`
- error message: `Cannot read properties of undefined (reading 'length')`

Reason:

- partial param input is validated as a full normalized param document

Evidence:

- `evidence/dev/rest-report.json`

## 3. Runtime split between browser storage and SQLite is not surfaced clearly

Severity: medium

Files:

- `src/lib/browser/assetStore.js`
- `src/server/repositories/assetRepository.js`
- `src/lib/api-client.js`

Observed behavior:

- static app library contents differ from REST server asset contents
- both are valid, but the runtime mode determines which store the user sees

User impact:

- looks like missing data or broken save/load unless the mode distinction is understood

## 4. `capabilities.customSpecimens = true` overstates the REST surface

Severity: medium

Files:

- `src/server/http/meta-handlers.js`

Observed behavior:

- server claims custom specimen support
- custom definition catalog and definition CRUD are not exposed over REST

Impact:

- tooling that trusts capabilities may assume a richer HTTP contract than exists

## 5. Branch-layer discoverability in `Refine` is weak

Severity: low

Files:

- `src/views/editor/RefineWorkspace.jsx`
- `src/views/editor/LevelControls.jsx`

Observed behavior:

- trunk and leader sections dominate the first screen
- per-tier branch controls exist, but are easy to miss because they are farther down and collapsed

Impact:

- feature is present
- discoverability is worse than the code structure suggests

## 6. Viewport responsibilities remain concentrated

Severity: low to medium

Files:

- `src/views/viewport/BotanyViewport.jsx`

Observed behavior:

- renderer bootstrap
- terrain lifecycle
- tree placement
- framing
- trunk/leaves/skeleton updates
- fallback rendering

all live in one component

Impact:

- maintenance risk
- higher chance of regressions in future viewport work

## 7. Headless WebGL is unavailable in Playwright on this machine

Severity: environmental, not necessarily app-broken

Observed behavior:

- Three.js cannot create a WebGL context in headless Chromium
- fallback UI appears correctly instead of crashing

Impact:

- automated browser evidence covers fallback mode, not the live 3D render path

Evidence:

- `evidence/static/ui-report.json`
