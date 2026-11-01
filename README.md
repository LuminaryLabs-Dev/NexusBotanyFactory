# NexusBotanyFactory

NexusBotanyFactory is a procedural tree authoring tool that is being evolved into a Unity-first tree-pack production workflow.

## Current Product Direction
- author procedural tree specimens
- preview `LOD0` through `LOD3` in the app
- assemble packs of exactly 10 saved trees
- export a pack spec for the companion packager
- package GLB intermediates and optional FBX outputs through Blender

## Main Docs
- [Goal](docs/product/GOAL.md)
- [Master Plan](docs/product/MASTER_PLAN.md)
- [LOD and Export Spec](docs/product/LOD_AND_EXPORT_SPEC.md)
- [Human View Validation](docs/product/HUMAN_VIEW_VALIDATION.md)

## Local development and SG-00/SG-01 validation

Requires Node.js 22+ and npm. The source of truth is the repository checkout, not previous sandbox-generated GLBs or images.

```bash
npm run check:env
npm ci
npm test
npm run build
```

`check:env` emits a JSON source/toolchain receipt. It does not run `npm ci` or verify rendering. The expected branch defaults to `build`; set `NBF_EXPECTED_BRANCH=work/nbf-sg00-sg01-validation-20261101` to validate the milestone development branch, and `NBF_EXPECTED_SHA=<sha>` to pin an exact commit. A dirty working tree is a failed clean-baseline check.

Browser/local storage mode: `npm run dev`. To run the REST API and Vite together:

```bash
npm run dev:stack
```

The REST service listens at `127.0.0.1:3002` by default. Vite must receive `VITE_API_PROVIDER=rest` and `VITE_API_BASE_URL`; its browser and SQLite persistence modes are separate. `npm run start:api` starts the API alone.

For the initial API check: `GET /api/health`, `POST /api/build/validate` with complete and partial inputs. Incomplete inputs must receive HTTP 422, not 500. Full authoring, WebGL, image, LOD and Unity checks remain separate acceptance steps. Keep runtime logs/screenshots in the project evidence workspace.

## Companion Packager
The app exports a JSON pack spec. The companion packager turns that spec into GLB outputs and attempts FBX conversion through Blender.

```bash
npm run pack:fbx -- ./MyPack.pack.json --out ./exports
```

If Blender is installed and available on `PATH`, the packager also emits `FBX` files. If Blender is unavailable, the packager still writes the intermediate outputs and manifest entries that show which FBX conversions are pending.
