# Build View Audit

Key files:

- `src/views/editor/EditorScreen.jsx`
- `src/views/editor/InspectorPanel.jsx`
- `src/views/editor/PresetPicker.jsx`
- `src/models/botany/ui/inspectorCatalog.js`
- `src/view-models/editorViewModel.js`

## Intended behavior

`Build` is the only tab with the live viewport and the main inspector.

It is responsible for:

- phenotype selection
- base-form controls
- leader-system controls
- variation controls
- viewport mode switching
- save and randomize actions

## Working in static/browser mode

- global tabs render in a single header row
- `Build` is the active default tab
- phenotype buttons render as a single horizontal scroll strip
- base-form sliders render
- leader-system sliders render
- `Frame`, `beauty`, `structure`, `bones`, and `leaf-density` controls render in the viewport overlay
- `Randomize` and `Save` are global actions in the header

Evidence:

- `evidence/static/build.png`
- `evidence/static/ui-report.json`

## Not working in dev-stack REST mode

- phenotype buttons do not render
- the inspector still mounts, but the preset list is empty
- the root cause is failed preset fetches, not the picker component itself

Evidence:

- `evidence/dev/build.png`
- `evidence/dev/ui-report.json`

## Notes

The `PresetPicker` implementation is sound for the static path. The observed empty phenotype section in dev mode is caused by catalog load failure upstream.
