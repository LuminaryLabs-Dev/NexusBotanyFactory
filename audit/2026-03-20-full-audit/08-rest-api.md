# REST API Audit

Audit target:

- isolated Nexus API on `127.0.0.1:3102`
- server entrypoint: `src/server/runtime/dev-server.js`

Evidence:

- `evidence/dev/rest-report.json`

## Implemented routes

Observed from source:

- `GET /api/health`
- `GET /api/schema`
- `GET /api/capabilities`
- preset CRUD
- asset CRUD
- camera get/patch
- stats
- tree-data
- duplicate
- apply-preset
- randomize-seed
- level patch
- build validate
- build normalize
- build from-preset-and-patch

## Runtime results

Working:

- `GET /api/health`
- `GET /api/schema`
- `GET /api/capabilities`
- `GET /api/presets`
- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/:id`
- `PATCH /api/assets/:id`
- `GET /api/assets/:id/camera`
- `PATCH /api/assets/:id/camera`
- `GET /api/assets/:id/stats`
- `GET /api/assets/:id/tree-data`
- `POST /api/assets/:id/duplicate`
- `POST /api/assets/:id/randomize-seed`
- `POST /api/assets/:id/apply-preset`
- `PATCH /api/assets/:id/levels/:depth`
- `DELETE /api/assets/:id`
- `POST /api/build/normalize`
- `POST /api/build/from-preset-and-patch`

Broken:

- `POST /api/build/validate`

Observed error:

- `500 Cannot read properties of undefined (reading 'length')`

Cause from source:

- `validateBuildHandler` calls `validateParams(body.params)` directly
- `validateParams()` expects a full normalized param object including `levels`
- the handler does not first normalize or merge with preset defaults

This means `validate` is not validating “a build request”; it is trying to validate a partial param patch as if it were a complete param document.

## Additional contract issue

`capabilities.implemented.customSpecimens = true` is only partially accurate.

Reason:

- custom specimens are supported inside the generation/runtime model
- but the REST surface does not expose dedicated custom definition CRUD or custom catalog routes

## Conclusion

The server is mostly real and functional once isolated from the port conflict. The main hard failure is `POST /api/build/validate`, and the main contract gap is overstated custom-specimen support at the HTTP layer.
