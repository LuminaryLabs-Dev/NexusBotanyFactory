# Product Intent

The application is intended to be a procedural botany workbench.

Primary user flow:

1. Choose a specimen phenotype or custom specimen.
2. Shape the specimen in `Build`.
3. Tune deeper structural rules in `Refine`.
4. Author or clone code-driven custom specimens in `Editor`.
5. Save and reload specimen studies in `Library`.

The architecture supports that intent:

- UI shell: `app/page.jsx`, `src/views/editor/EditorScreen.jsx`
- build inspector: `src/views/editor/InspectorPanel.jsx`
- refine workspace: `src/views/editor/RefineWorkspace.jsx`
- custom specimen authoring: `src/views/editor/CustomSpecimenEditorPanel.jsx`
- library: `src/views/editor/LibraryPanel.jsx`
- viewport: `src/views/viewport/BotanyViewport.jsx`
- generation entrypoint: `src/models/botany/services/specimenGenerationService.js`
- factories: `src/models/botany/factories/*`
- pipeline: `src/models/botany/pipeline/*`
- browser storage: `src/lib/browser/*`
- REST server: `src/server/runtime/dev-server.js`, `src/server/http/*`

The codebase is aiming for:

- MVVM-style separation
- species/family factories
- structured generation pipeline
- browser-static deployment for GitHub Pages
- optional REST surface for development and tooling
- metadata-driven inspector controls, including custom specimen fields

The code and UI both show a shift from “raw procedural debug panel” toward “guided editor”:

- `Build` is artist-facing
- `Refine` is technical
- `Editor` is for custom specimen definitions
- `Library` is persistence-oriented

That intent is coherent. The main gap is runtime consistency between static/browser mode and dev/REST mode.
