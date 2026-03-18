export const toVectorObject = (vector) => ({
  x: Number(vector.x.toFixed(4)),
  y: Number(vector.y.toFixed(4)),
  z: Number(vector.z.toFixed(4)),
})

export const serializeTreeData = (treeData) => ({
  nodes: treeData.nodes.map((node) => ({
    depth: node.depth,
    parentIdx: node.parentIdx,
    points: node.points.map((point) => ({
      id: point.id,
      parentId: point.parentId,
      boneId: point.boneId,
      radius: Number(point.radius.toFixed(4)),
      depth: point.depth,
      length: Number(point.length.toFixed(4)),
      isTwig: Boolean(point.isTwig),
      t: point.t,
      pos: toVectorObject(point.pos),
      dir: toVectorObject(point.dir),
    })),
  })),
  skeleton: treeData.skeleton.map((bone) => ({
    id: bone.id,
    parentId: bone.parentId,
    radius: Number(bone.radius.toFixed(4)),
    depth: bone.depth,
    length: Number(bone.length.toFixed(4)),
    isTwig: Boolean(bone.isTwig),
    t: bone.t ?? null,
    pos: toVectorObject(bone.pos),
    dir: toVectorObject(bone.dir),
  })),
  leafInstances: treeData.leafInstances.map((leaf) => ({
    boneId: leaf.boneId,
    radius: Number(leaf.radius.toFixed(4)),
    angle: Number(leaf.angle.toFixed(4)),
    pitch: Number(leaf.pitch.toFixed(4)),
    roll: Number(leaf.roll.toFixed(4)),
    pos: toVectorObject(leaf.pos),
    dir: toVectorObject(leaf.dir),
  })),
})

export const assetSummary = (asset) => ({
  id: asset.id,
  name: asset.name,
  kind: asset.kind,
  presetId: asset.presetId,
  tags: asset.tags,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
})
