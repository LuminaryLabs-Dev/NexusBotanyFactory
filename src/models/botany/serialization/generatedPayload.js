import * as THREE from 'three'

const vectorToPlain = (vector) => ({
  x: Number(vector.x),
  y: Number(vector.y),
  z: Number(vector.z),
})

const plainToVector = (value) => new THREE.Vector3(value.x, value.y, value.z)

const serializeBone = (bone) => ({
  ...bone,
  pos: vectorToPlain(bone.pos),
  dir: vectorToPlain(bone.dir),
})

const deserializeBone = (bone) => ({
  ...bone,
  pos: plainToVector(bone.pos),
  dir: plainToVector(bone.dir),
})

const serializeNode = (node) => ({
  ...node,
  points: node.points.map(serializeBone),
})

const deserializeNode = (node) => ({
  ...node,
  points: node.points.map(deserializeBone),
})

const serializeLeafInstance = (leaf) => ({
  ...leaf,
  pos: vectorToPlain(leaf.pos),
  dir: vectorToPlain(leaf.dir),
})

const deserializeLeafInstance = (leaf) => ({
  ...leaf,
  pos: plainToVector(leaf.pos),
  dir: plainToVector(leaf.dir),
})

const serializeDebugOverlays = (debugOverlays = {}) => ({
  ...debugOverlays,
  skeletonLines: debugOverlays.skeletonLines?.map((segment) => ({
    ...segment,
    from: segment.from ? vectorToPlain(segment.from) : null,
    to: segment.to ? vectorToPlain(segment.to) : null,
  })) ?? [],
})

export const serializeGeneratedPayload = (generated) => ({
  validation: generated.validation,
  stats: generated.stats,
  renderArtifacts: generated.renderArtifacts
    ? {
        ...generated.renderArtifacts,
        debugOverlays: serializeDebugOverlays(generated.renderArtifacts.debugOverlays),
      }
    : null,
  treeData: generated.treeData
    ? {
        nodes: generated.treeData.nodes.map(serializeNode),
        skeleton: generated.treeData.skeleton.map(serializeBone),
        leafInstances: generated.treeData.leafInstances.map(serializeLeafInstance),
      }
    : null,
})

export const deserializeGeneratedPayload = (payload) => ({
  ...payload,
  treeData: payload.treeData
    ? {
        nodes: payload.treeData.nodes.map(deserializeNode),
        skeleton: payload.treeData.skeleton.map(deserializeBone),
        leafInstances: payload.treeData.leafInstances.map(deserializeLeafInstance),
      }
    : null,
})
