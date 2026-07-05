# NexusBotanyFactory Goal

## Product Promise
NexusBotanyFactory exists to let environment and technical artists author, review, batch-produce, and export Unity-ready tree packs from a procedural workflow instead of building every tree by hand.

The v1 release target is a production workflow that can:

1. Author and save specimen variants.
2. Generate four LOD tiers per tree.
3. Assemble a batch pack of exactly 10 trees.
4. Export a validated intermediate bundle for packaging.
5. Convert that bundle into Unity-ready FBX deliverables through a companion packager.

## Primary User
The primary user is an artist or small content team producing vegetation packs for the Unity Asset Store.

They need:

- repeatable variation across trees
- visible LOD review before export
- batch packaging instead of one-off manual export
- consistent pivots, naming, and folder layout
- validation that the pack is store-ready

## Release Criteria
The app is considered release-ready for v1 when it can:

1. Save and reload tree variants reliably.
2. Generate `LOD0` through `LOD3` for each exportable tree asset.
3. Preview the LOD chain in the app.
4. Assemble a pack containing 10 trees.
5. Export an intermediate pack spec with manifests and impostor data.
6. Run the companion packager to emit Unity-ready FBX outputs when Blender is available.
7. Produce QA evidence for the authoring UI, LOD previews, and packaged outputs.

## Non-Goals
The v1 release does not aim to provide:

- hand-sculpting or direct mesh editing
- photogrammetry ingestion
- Unreal-first packaging
- custom shader graph authoring inside the app
- browser-only final FBX conversion

## Product Principles
- Authoring stays procedural and fast.
- LOD generation is part of the asset model, not an afterthought.
- Export is pack-oriented, not specimen-oriented.
- User-visible validation is mandatory before claiming a milestone complete.
