# NexusBotanyFactory

NexusBotanyFactory is a procedural tree authoring tool that is being evolved into a Unity-first tree-pack production workflow.

## Current Product Direction
- author procedural tree specimens
- preview `LOD0` through `LOD3` in the app
- assemble packs of exactly 10 saved trees
- export a pack spec for the companion packager
- package GLB intermediates and optional FBX outputs through Blender

## Main Docs
- [Goal](/Users/crimsonwheeler/Documents/GitHub/NexusBotanyFactory/docs/product/GOAL.md)
- [Master Plan](/Users/crimsonwheeler/Documents/GitHub/NexusBotanyFactory/docs/product/MASTER_PLAN.md)
- [LOD and Export Spec](/Users/crimsonwheeler/Documents/GitHub/NexusBotanyFactory/docs/product/LOD_AND_EXPORT_SPEC.md)
- [Human View Validation](/Users/crimsonwheeler/Documents/GitHub/NexusBotanyFactory/docs/product/HUMAN_VIEW_VALIDATION.md)

## Local Authoring App
```bash
npm run dev
```

## Companion Packager
The app exports a JSON pack spec. The companion packager turns that spec into GLB outputs and attempts FBX conversion through Blender.

```bash
npm run pack:fbx -- ./MyPack.pack.json --out ./exports
```

If Blender is installed and available on `PATH`, the packager also emits `FBX` files. If Blender is unavailable, the packager still writes the intermediate outputs and manifest entries that show which FBX conversions are pending.
