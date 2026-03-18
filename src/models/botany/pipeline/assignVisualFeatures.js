export const assignVisualFeatures = ({ recipe, growthContext, structureGraph }) => ({
  materialRecipe: {
    profile: recipe.strategyKeys.material,
    bark: {
      barkColor: recipe.params.barkColor,
      barkTint: recipe.params.barkTint,
      fiberIntensity: recipe.params.fiberIntensity,
      crackDepth: recipe.params.crackDepth,
      mossAmount: recipe.params.mossAmount,
      blendBias: recipe.params.blendBias,
      roughnessVar: recipe.params.roughnessVar,
    },
    foliage: {
      leafColor: recipe.params.leafColor,
      leafStyle: recipe.params.leafStyle,
      leafArrangement: recipe.params.leafArrangement,
      leafSize: recipe.params.leafSize,
    },
  },
  terrainRecipe: {
    ...recipe.descriptors.terrain,
    family: recipe.family,
    complexity: structureGraph.segmentGraph.length > 15000 ? 'high' : 'standard',
  },
  featureAssignments: {
    branchCount: structureGraph.segmentGraph.length,
    foliageAnchorCount: structureGraph.foliageAnchorSet.length,
    usesLeaderCompetition: growthContext.usesLeaders,
    usesCrowding: growthContext.usesCrowding,
  },
})
