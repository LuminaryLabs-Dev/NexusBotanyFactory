# NexusBotanyFactory Master Plan

## Phase 1: Product Foundation
- Replace the placeholder project docs with product docs.
- Add a formal export asset model on top of the current render artifacts.
- Add a dedicated pack workflow instead of overloading `Library`.
- Surface staged export capability metadata in browser and server modes.

## Phase 2: LOD Authoring
- Keep `LOD0` as the hero tree.
- Add `LOD1` clustered leaf cards.
- Add `LOD2` canopy-summary cards and stronger branch reduction.
- Add in-app LOD preview.

## Phase 3: Impostors
- Define a 16-view impostor contract.
- Bake impostor atlas data from generated trees.
- Add `LOD3` preview and validation against `LOD2`.

## Phase 4: Intermediate Export + Companion Packager
- Export a structured intermediate pack spec from the app.
- Package GLB intermediates and manifests through a companion CLI.
- Convert GLB to FBX through Blender when available.
- Emit Unity-oriented folder layout and metadata.

## Phase 5: Release Surface
- Add batch pack assembly for exactly 10 trees.
- Add QA gates for missing LODs, invalid metadata, and budget overruns.
- Replace the template README with product usage and packager setup docs.
- Validate packaged outputs in a Unity verification workflow.

## Milestone Acceptance
- Every phase must have human-view evidence.
- Every phase must leave the app in a runnable state.
- Export milestones are not accepted without manifest validation.
