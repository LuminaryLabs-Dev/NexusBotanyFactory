# SG-03 — Standalone native-style tree editor

**Status:** SG-03 complete as the approved **standalone WebGL2 prototype milestone** (2026-11-01). This is not a production React/Three.js release.

Open [editor.html](editor.html) in Chrome or Edge with WebGL2 enabled. This is the exact verified offline HTML delivered for the 105-tree editor, with five individual provisional native-trait controls for every taxon.

## Delivered
- 105 selectable tree types (five original references plus 100 catalog records)
- Per-tree taxon-specific parameter bars, bounds, seeded randomization and recipe metadata
- GPU WebGL2 rendering with adjustable vertex-shader wind and instance-based foliage
- Four baked-in-memory LOD representations; hard triangle limits 30,000 / 14,500 / 4,500 / 320
- Save Variant, recipe import/export, and 3D LOD geometry export (JSON)
- Browser screenshot fallback if WebGL2 is unavailable

## Validation and limits
Previously captured Chromium / ANGLE SwiftShader validation: **20/20 passed, zero page errors**. The HTML's exact SHA-256 is `e506af8243a3d6359b10605a6256f2248921b489a11cd270206375f6fee5cc83`. The appended Node test checks packaging and required interfaces; **it is not equivalent to a runtime browser test**.

This editor is a standalone artifact. Botanical slider limits are provisional art-direction bands, not certified wild-range statistics. The LOD3 foliage proxy is not a sixteen-view impostor. Hardware GPU performance and Unity/FBX import have not been validated.

**All uncompleted production acceptance work belongs to SG-04**: see [SG-04 plan](../../docs/subgoals/SG-04-PRODUCTION-ACCEPTANCE.md). Do not replace the existing production BotanyViewport or assume unvalidated patches have passed.

Source evidence: [SG-03 project record](https://docs.google.com/document/d/1vAqOjGSAGf65p_TN72d3L8vObnQClhL3yh_R46eus1I/edit).
