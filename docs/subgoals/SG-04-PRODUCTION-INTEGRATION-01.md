# SG-04 — First production renderer / native profile integration

**Scope:** working development branch, not the `build` release branch. This is a bounded implementation milestone, **not SG-04 acceptance**.

## Code integrated

- Versioned native parameter contracts for Pine, Oak, Willow, Birch and Cypress; species-aware defaults, bounds, coupled trunk/height edits, reproducible randomization, explicit (opt-in) legacy normalizer.
- Actual editor: five selectable built-in presets, four featured native sliders per species, range errors, non-Pine static factory preview; Pine growth timeline remains available. Main Randomize uses the species-specific contract.
- Production `BotanyViewport`: alpha-tested five-shape foliage silhouettes on shared instanced GPU leaf planes (no new leaf polygons), species-specific sizes and shader wind for LOD0 foliage; LOD1/2 leaf-card material/geometry shared among card meshes to reduce allocations.
- Native oak generator: bounded 3D crown envelope with smooth inward steering and less excessive first-level limb length. Other species retain their previous native skeleton generation strategy.
- Added pure geometry/folio profile property tests and production-factory oak generation smoke test.

## Test boundaries

The sandbox has no usable npm dependency cache or outbound npm resolution, so it can run contract/structure Node tests and JSX parser checks but **cannot execute the full Vite/React/Three app** locally. GitHub Actions must run `npm ci`, `npm test`, `npm run build` and the existing browser shell smoke at the pushed commit before this integration milestone is accepted as production-build ready. Rendering correctness and screenshot evidence require a WebGL-capable browser; a successful Vite bundle or WebGL fallback screenshot is not real GPU acceptance.

The initial scope covers five reference species only. The other 100 taxa in the SG-03 standalone editor are **not** integrated as authoritative production profiles by this change. Production total-triangle budgeting across trunk+leaves, fully accepted 16-view impostors, persistence across restarts, final material realism, Unity import and 315 production seeds all remain SG-04 **OPEN**.

## Next gate

Run and inspect real production browser/WebGL rendering for all five reference species and four LODs, then integrate the remaining 100 native contracts with 315 source-generation checks and art references. Keep `build` untouched until authorized release review.
