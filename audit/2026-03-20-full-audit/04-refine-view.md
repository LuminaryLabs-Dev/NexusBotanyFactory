# Refine View Audit

Key files:

- `src/views/editor/RefineWorkspace.jsx`
- `src/views/editor/LevelControls.jsx`
- `src/models/botany/ui/inspectorCatalog.js`

## Intended behavior

`Refine` is a full-width workspace without the Three.js preview.

It is responsible for:

- true trunk tuning
- leader rules
- branch-awareness controls
- terminal growth controls
- bark/material controls
- per-tier branch layer controls

## Working

- `Refine` is a separate workspace, not a side-panel mode
- top-level refine field groups render
- `True Trunk` controls render
- `Leader Rules` controls render
- branch layers are modeled as separate `InspectorSectionCard` blocks after the trunk config
- level titles are correctly renamed:
  - depth 0 -> `Primary Branches`
  - depth 1+ -> `Branch Layer N`

Evidence:

- `evidence/static/refine.png`

## Gaps

- the branch layer cards are below the fold and are not surfaced strongly in the first viewport-height of the page
- in Playwright DOM capture, I did not see a strong first-screen indicator that the branch tiers exist, even though the source shows they do

This is not a functional break, but it is a discoverability issue.

## Source conclusion

The refine architecture is present and structurally correct. The remaining issue is presentation and scanability, not missing logic.
