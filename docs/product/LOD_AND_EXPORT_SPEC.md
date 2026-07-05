# LOD and Export Spec

## Export Profile
Default export profile: `unity-fbx-v1`

- units: meters
- up axis: `Y`
- root pivot: tree root at terrain contact
- naming: `TreeName_LOD0` through `TreeName_LOD3`
- pack size: 10 trees

## LOD Chain
### LOD0
- full branch mesh
- full foliage representation
- highest material fidelity

### LOD1
- simplified branch mesh
- clustered leaf cards derived from generated foliage instances
- intended for mid-range view

### LOD2
- reduced scaffold branch mesh
- larger canopy cards derived from merged foliage clusters
- intended for far-range view before impostor swap

### LOD3
- impostor billboard or low-card impostor mesh
- 16 frames total
- 8 azimuth directions x 2 elevation bands
- atlas outputs:
  - albedo/alpha
  - normal
  - mask/depth support

## Leaf Card Clustering Rules
- Use generated `leafInstances` as the source of truth.
- Cluster by branch-tip neighborhood first.
- Merge by spatial cell size for lower LODs.
- Fit cards around cluster centers using principal directions.
- Preserve canopy silhouette before preserving local detail.

## Intermediate Pack Spec
Each export pack spec must include:

- pack metadata
- export profile
- the 10 selected trees
- serialized generated payload for each tree
- LOD descriptors
- impostor atlas metadata or baked atlas payloads

## Companion Packager Output
For each tree:

- `TreeName_LOD0.fbx`
- `TreeName_LOD1.fbx`
- `TreeName_LOD2.fbx`
- `TreeName_LOD3.fbx`
- atlas textures
- manifest entry

For each pack:

- pack manifest
- tree folders
- preview imagery
- Unity import notes
