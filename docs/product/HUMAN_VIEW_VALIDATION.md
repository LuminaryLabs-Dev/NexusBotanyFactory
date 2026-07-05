# Human View Validation

Before accepting a user-visible milestone, ask:

`Have I checked what the human would actually see, and do I need screenshots, visual inspection, launch-state inspection, or before/after comparison to validate this properly?`

## Required Visible Checks
### Build
- specimen loads
- LOD controls are understandable
- LOD swaps are visible and credible
- framing remains stable

### Refine
- structural controls remain readable after export-related additions

### Packs
- adding and removing trees is obvious
- pack completion state is visible
- export warnings are actionable

### Export Artifacts
- exported pack manifest matches the UI selection
- generated file layout is readable
- Unity import evidence exists for release candidates

## Required Evidence
- before/after screenshots for LOD-related UI changes
- screenshots for each LOD preview mode
- screenshots or equivalent evidence for exported pack folders
- Unity import screenshots for release validation

## Failure Conditions
- hidden LOD mismatches
- missing pack members
- broken pivots or scaling
- unreadable export errors
- visible silhouette collapse between adjacent LODs
