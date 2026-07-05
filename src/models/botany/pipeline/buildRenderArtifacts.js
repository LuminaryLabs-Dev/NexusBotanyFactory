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
    centerX: visualFeatures.terrainRecipe.terrainCenterX,
    centerZ: visualFeatures.terrainRecipe.terrainCenterZ,
    innerRadius: visualFeatures.terrainRecipe.terrainInnerRadius,
    smallRidgeRadius: visualFeatures.terrainRecipe.terrainSmallRidgeRadius,
    largeRidgeRadius: visualFeatures.terrainRecipe.terrainLargeRidgeRadius,
    outerRimRadius: visualFeatures.terrainRecipe.terrainOuterRimRadius,
    innerDepth: visualFeatures.terrainRecipe.terrainInnerDepth,
    smallRidgeHeight: visualFeatures.terrainRecipe.terrainSmallRidgeHeight,
    largeRidgeHeight: visualFeatures.terrainRecipe.terrainLargeRidgeHeight,
    outerRimHeight: visualFeatures.terrainRecipe.terrainOuterRimHeight,
    noiseAmplitude: visualFeatures.terrainRecipe.terrainNoiseAmplitude,
    noiseFrequency: visualFeatures.terrainRecipe.terrainNoiseFrequency,
    microNoiseAmplitude: visualFeatures.terrainRecipe.terrainMicroNoiseAmplitude,
    microNoiseFrequency: visualFeatures.terrainRecipe.terrainMicroNoiseFrequency,
    slopeSharpening: visualFeatures.terrainRecipe.terrainSlopeSharpening,
    basinFlattening: visualFeatures.terrainRecipe.terrainBasinFlattening,
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
