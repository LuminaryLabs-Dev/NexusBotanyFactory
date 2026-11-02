# SG-04 — Production integration and acceptance

**Status:** READY / NOT COMPLETE. **Source milestone:** SG-03 (standalone prototype complete). Project owner outcome: LUM-000157, NBF-001; later outcome tasks NBF-002–NBF-007 remain governed by the existing canonical tracker.

**Target:** Transfer the verified SG-03 WebGL2 foliage, wind, four LODs and taxon-specific parameter contracts into the **production NexusBotanyFactory** React/Three.js application, without duplicating generation implementations.

## Ordered execution gates

1. **Source baseline.** Verify development branch SHA, test dependencies, read the existing generator/renderer/export APIs and audit the reference patches stored in [SG-04 Drive folder](https://drive.google.com/drive/folders/1f2qa6fLlcWGU123KdX3Ogk-GPdm-w6e9). These patches are **unapplied**, potentially conflicting **candidates**, not production-validated changes.
2. **Production contracts.** Adapt versioned taxon/age/habitat schema and coupled param validation into `src/models/botany/`; preserve saved-asset compatibility. Replace shared generic sliders with per-taxon controls; preserve exact scientific ID on randomize, edit, save/reload and export. Validate the original five first and then the 100 additional records.
3. **Production renderer.** Reuse current generator data in the existing React `BotanyViewport`, not a parallel full-screen renderer. Integrate instanced source-attached twigs and leaf/spray materials; bind stable `uWind`, `uTime` and per-vertex stiffness. Validate visual response and performance.
4. **Baked LOD integration.** Reconcile LOD0–3 with existing treeAsset descriptors. Budget **all wood and foliage triangles** at 30,000 / 14,500 / 4,500 / 320; deterministic smooth transitions, no popping; replace proxy LOD3 with verified 16-view impostor atlas.
5. **Reproducibility and persistence.** Run >=3 deterministic seeds per 105 taxa (315 generation runs) plus correlated parameter-boundary tests, negative validation, save/reopen after browser restart, and JSON/mesh integrity checks. Retain hashes, logs and representative screenshots.
6. **Art review.** Inspect >=15 representative tree species across genus/habitat families and >=2 growth stages; record width/height envelope, canopy density, bark/foliage traits, range violations and remaining provisional scientific claims. Repair visibly wrong results.
7. **Delivery/export.** Verify native 10-tree pack, GLB/FBX and real Unity import, materials, transforms, pivots, LOD switching and textures. Record real browser WebGL and GPU-hardware performance where possible.

## First bounded task
Apply and test the five reference species contracts and production editor integration, then validate native geometry and WebGL visuals. Expand to the other 100 only after the first gate is proven in the production app. Maintain one authoritative generator/data model.

## Acceptance and definition of done
All seven gates require executable evidence: passing CI, actual WebGL screenshots in the production editor, complete LOD caps and transitions, 315 deterministic runs, persistent correct recipe identity, export and Unity import proof, and a documented 15-taxon art review. Missing or provisional artifacts remain OPEN, not silently accepted. Failed/unavailable hardware or Unity checks must be recorded as blockers.

## Artifacts and scope safety
- Source prototype: [SG-03 editor](../../prototypes/sg03-native-webgl/editor.html)
- Scope record: [SG-03 closure](SG-03-COMPLETE.md)
- Candidate local source patches: [SG-04 Drive folder](https://drive.google.com/drive/folders/1f2qa6fLlcWGU123KdX3Ogk-GPdm-w6e9)
- Evidence and status: [SG-03 record](https://docs.google.com/document/d/1vAqOjGSAGf65p_TN72d3L8vObnQClhL3yh_R46eus1I/edit) and [canonical tracker](https://docs.google.com/spreadsheets/d/17v4jVIRWQ_ehcgY8JBCXv00l-NUBxECyjneFFfq6rV4/edit)

**Do not mark SG-04 complete merely because the standalone SG-03 editor passes.** Changes require normal review, CI and explicit deployment authorization.
