# Editor and Custom Specimens Audit

Key files:

- `src/views/editor/CustomSpecimenEditorPanel.jsx`
- `src/views/editor/FieldControls.jsx`
- `src/models/botany/custom-specimens/builtins.js`
- `src/models/botany/custom-specimens/runtime.js`
- `src/models/botany/custom-specimens/store.js`
- `src/models/botany/custom-specimens/fieldSpec.js`
- `src/models/botany/factories/CustomSpecimenFactory.js`

## Intended behavior

The `Editor` tab is a definition authoring surface for code-driven custom specimens.

Each definition contains:

- metadata
- defaults
- control schema
- generator source

The inspector fields are declared via serialized field descriptors, similar to Unity-style serialized metadata.

## Working

- `Editor` is a global top-level workspace
- built-in custom specimen definitions auto-load
- observed built-ins:
  - `Windcrest Pine`
  - `Lantern Oak`
  - `Weeping Cypress`
  - `Moss Shrub`
- definition metadata renders
- serialized field editor renders
- generator source editor renders
- read-only preview of the custom inspector fields renders

Evidence:

- `evidence/static/editor.png`
- `evidence/static/ui-report.json`

## Architectural strengths

- runtime compilation is cached by source hash in `runtime.js`
- field metadata is normalized centrally
- the custom factory wraps the standard factory system instead of bypassing it
- built-in templates are read-only and can be cloned

## Gaps

- custom specimen definition CRUD is browser-local; there is no dedicated REST contract for the definition catalog
- `capabilities.customSpecimens = true` on the server overstates what the REST API currently exposes
- the custom runtime uses `new Function(...)`, which is pragmatic for this app but not sandboxed beyond API surface discipline

## Conclusion

This feature is real and substantially implemented. It is one of the stronger parts of the current codebase.
