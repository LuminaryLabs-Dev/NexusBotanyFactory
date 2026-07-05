import bpy
import sys
from pathlib import Path


def parse_args():
    if "--" not in sys.argv:
        raise RuntimeError("Expected Blender arguments after --")
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) != 2:
        raise RuntimeError("Usage: blender -b -P convert_glb_to_fbx.py -- <input.glb> <output.fbx>")
    return Path(args[0]), Path(args[1])


def main():
    input_path, output_path = parse_args()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    bpy.ops.export_scene.fbx(
        filepath=str(output_path),
        use_selection=False,
        path_mode="COPY",
        embed_textures=False,
        axis_up="Y",
        axis_forward="-Z",
    )


if __name__ == "__main__":
    main()
