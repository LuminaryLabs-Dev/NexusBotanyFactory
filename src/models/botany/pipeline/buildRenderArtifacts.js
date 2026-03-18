const buildSkeletonLines = (segmentGraph) => segmentGraph
  .filter((segment) => segment.parentId != null && segment.parentId >= 0)
  .map((segment) => ({
    fromId: segment.parentId,
    toId: segment.id,
    from: segmentGraph.find((candidate) => candidate.id === segment.parentId)?.pos ?? null,
    to: segment.pos,
  }))
  .filter((segment) => segment.from)

const createFoliageSignature = (recipe, structureGraph) => JSON.stringify({
  leafStyle: recipe.params.leafStyle,
  leafArrangement: recipe.params.leafArrangement,
  leafCount: recipe.params.leafCount,
  leafSize: recipe.params.leafSize,
  anchorCount: structureGraph.foliageAnchorSet.length,
})

export const buildRenderArtifacts = ({ recipe, structureGraph, visualFeatures }) => ({
  structureSignature: structureGraph.structureSignature,
  foliageSignature: createFoliageSignature(recipe, structureGraph),
  terrainSignature: JSON.stringify({
    profile: visualFeatures.terrainRecipe.profile,
    size: visualFeatures.terrainRecipe.size,
    resolution: visualFeatures.terrainRecipe.resolution,
    seed: visualFeatures.terrainRecipe.seed,
  }),
  trunkGeometryRecipe: {
    radialSegments: 8,
    nodeCount: structureGraph.axisGraph.length,
  },
  foliageInstances: structureGraph.treeData.leafInstances,
  terrainRecipe: visualFeatures.terrainRecipe,
  materialRecipe: visualFeatures.materialRecipe,
  debugOverlays: {
    skeletonLines: buildSkeletonLines(structureGraph.segmentGraph),
  },
})
