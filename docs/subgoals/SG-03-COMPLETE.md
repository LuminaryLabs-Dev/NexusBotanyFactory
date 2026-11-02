# SG-03 — Completed standalone WebGL2 species authoring

**Disposition:** COMPLETE — user-directed milestone closure, 2026-11-01. **Scope:** the independently running **standalone** SG-03 WebGL2 authoring prototype and evidence. Do not interpret this closure as production application acceptance.

## Delivered and tested

- 105 procedural types; five taxon-aware native trait sliders each, with provisional natural-style limits
- Species-aware randomization, variant save/reopen in the running page, recipe and baked-LOD JSON export
- Rendered WebGL2 tree geometry, instanced foliage, vertex-adjustable leaf wind and four distance-based LODs
- Total peak tree geometry constrained at LOD0 30,000 triangles; lower caps 14,500 / 4,500 / 320
- Reference morphology distinctions for conifers, broadleaf and desert growth forms
- Chromium/ANGLE SwiftShader browser receipt: 20/20 checks passed and no page errors; representative geometry and slider changes inspected
- Verified exact HTML file hash and standalone launch ZIP integrity

Implementation: [prototypes/sg03-native-webgl/editor.html](../../prototypes/sg03-native-webgl/editor.html). Evidence: [project SG-03 document](https://docs.google.com/document/d/1vAqOjGSAGf65p_TN72d3L8vObnQClhL3yh_R46eus1I/edit) and [Drive evidence ZIP](https://drive.google.com/file/d/1nO8cRnZnWzbxdDeIgHr3zlQpX0FF6fVt/view).

## Closure boundary / explicit exclusions

The standalone implementation has **not** been integrated into the production React/Three.js BotanyViewport. Botanical accuracy of all 105 types remains provisional. The 315-run native production regression, production persistence, sixteen-view impostor atlas, real pack/GLB/FBX/Unity pipeline, and hardware GPU performance have **not** passed the required production acceptance gates.

**All uncompleted tasks have been transferred to SG-04:** [SG-04 Production Integration and Acceptance](SG-04-PRODUCTION-ACCEPTANCE.md). The parent task NBF-001 remains **In Progress** until its separate acceptance conditions pass. NBF-003 and other broader outcome tasks are not automatically complete.

## Source control
SG-03 delivered to the existing development branch only. No merge to `build`, no production deployment, and no assertion that carried-forward candidate patches are applied.
