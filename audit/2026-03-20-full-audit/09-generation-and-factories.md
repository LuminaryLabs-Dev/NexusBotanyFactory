# Generation and Factories Audit

Key files:

- `src/models/botany/services/specimenGenerationService.js`
- `src/models/botany/factories/BaseBotanyFactory.js`
- `src/models/botany/factories/CustomSpecimenFactory.js`
- `src/models/botany/factories/factoryRegistry.js`
- `src/models/botany/pipeline/GenerationPipeline.js`
- `src/models/botany/pipeline/*`
- `src/models/botany/generation/tree-data.js`
- `src/models/botany/generation/camera.js`

## Current structure

The generation path is:

1. choose a factory
2. normalize and validate a specimen
3. run the generation pipeline
4. summarize stats and orbit target
5. return render artifacts plus tree data

The architecture is more modular than a single monolith, but it is still uneven.

## What is working

- a factory registry exists
- a shared `BaseBotanyFactory` exists
- the pipeline stages are explicit:
  - recipe creation
  - growth context derivation
  - structure graph build
  - visual feature assignment
  - render artifact build
- custom specimens reuse the standard generation path through `CustomSpecimenFactory`

## Where it is still thin

- much of the actual procedural complexity is still downstream of the “pipeline” boundary
- `BaseBotanyFactory.generate()` asks the pipeline for output, but the important behavior is still concentrated in the lower generation layers
- the pipeline result does not produce independent stats; `BaseBotanyFactory.summarize()` recomputes summary values afterward

## Camera/orbit note

The runtime no longer treats inspector camera controls as authoritative, but camera fields still exist in:

- schema
- validation
- asset persistence
- REST camera patch routes

This is backward-compatible, but architecturally inconsistent.

## Custom generation note

`CustomSpecimenFactory` is effective because it does not generate meshes directly. It returns a patch against a base preset and then re-enters the normal factory path. That is a sensible design for performance and compatibility.

## Conclusion

The factory/pipeline shape is credible. The remaining problem is depth: the code is organized as if generation is highly modular, but the real algorithmic complexity is still concentrated in a small number of deep generation modules.
