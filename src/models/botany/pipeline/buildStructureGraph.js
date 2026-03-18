import { generateTreeData } from '../generation/tree-data.js'

const buildAxisGraph = (treeData) => treeData.nodes.map((node, index) => ({
  id: `axis:${index}`,
  depth: node.depth,
  parentIdx: node.parentIdx,
  pointCount: node.points.length,
  isLeader: Boolean(node.isLeader),
  leaderClass: node.leaderClass ?? null,
}))

const buildSegmentGraph = (treeData) => treeData.skeleton.map((bone) => ({
  id: bone.id,
  parentId: bone.parentId,
  depth: bone.depth,
  radius: bone.radius,
  length: bone.length,
  isTwig: Boolean(bone.isTwig),
  isLeader: Boolean(bone.isLeader),
  leaderClass: bone.leaderClass ?? null,
  pos: bone.pos,
  dir: bone.dir,
}))

const buildFoliageAnchorSet = (treeData) => {
  const anchorIds = new Set(treeData.leafInstances.map((leaf) => leaf.boneId))
  return Array.from(anchorIds).map((boneId) => ({ boneId }))
}

const createStructureSignature = (recipe, treeData) => JSON.stringify({
  presetName: recipe.presetName,
  kind: recipe.kind,
  seed: recipe.params.seed,
  recursion: recipe.params.recursion,
  branchLevels: recipe.params.levels.map((level) => ({
    segments: level.segments,
    curve: level.curve,
    branchCount: level.branchCount,
    branchAngle: level.branchAngle,
    lengthScale: level.lengthScale,
    radiusScale: level.radiusScale,
  })),
  skeletonCount: treeData.skeleton.length,
  nodeCount: treeData.nodes.length,
})

export const buildStructureGraph = ({ recipe, growthStrategy, leafPlacementStrategy, twigGrowthStrategy }) => {
  const treeData = generateTreeData(recipe.params, {
    mode: recipe.mode,
    growthStrategy,
    leafPlacementStrategy,
    twigGrowthStrategy,
  })

  return {
    treeData,
    axisGraph: buildAxisGraph(treeData),
    segmentGraph: buildSegmentGraph(treeData),
    foliageAnchorSet: buildFoliageAnchorSet(treeData),
    structureSignature: createStructureSignature(recipe, treeData),
  }
}
