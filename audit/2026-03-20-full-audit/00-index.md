# NexusBotanyFactory Audit

Date: 2026-03-20

This audit covers:

- product intent inferred from the codebase
- runtime behavior in static/browser mode
- runtime behavior in local dev-stack REST mode
- REST API contract behavior on an isolated Nexus API port
- source inspection of the main feature files

Evidence folders:

- `evidence/static/`: Playwright screenshots and UI report for the shipped static/browser-provider path
- `evidence/dev/`: Playwright screenshots and REST reports for the dev/REST path

Audit files:

- `01-product-intent.md`
- `02-runtime-modes.md`
- `03-build-view.md`
- `04-refine-view.md`
- `05-editor-custom-specimens.md`
- `06-library-and-persistence.md`
- `07-viewport-and-rendering.md`
- `08-rest-api.md`
- `09-generation-and-factories.md`
- `10-broken-findings.md`

Top conclusions:

1. The app’s core intention is a procedural specimen editor with four global workspaces: Build, Refine, Editor, and Library.
2. The shipped static/browser mode is the most functional runtime right now.
3. The current dev stack is misconfigured and points the web app at the wrong REST service.
4. The standalone Nexus REST API mostly works when run on an isolated port, but `POST /api/build/validate` is broken.
5. Custom specimens are implemented and inspector-driven, but they are browser-managed, not fully REST-exposed.
