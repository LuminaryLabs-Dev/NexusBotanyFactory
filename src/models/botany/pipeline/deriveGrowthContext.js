export const deriveGrowthContext = (recipe) => ({
  recipeId: recipe.id,
  presetName: recipe.presetName,
  family: recipe.family,
  kind: recipe.kind,
  branchLevels: recipe.params.recursion + 1,
  usesLeaders: (recipe.params.leaderCount ?? 0) > 0,
  usesCrowding: (recipe.params.branchAwarenessRadius ?? 0) > 0 || (recipe.params.leaderAwarenessRadius ?? 0) > 0,
  terrainProfile: recipe.descriptors.terrain.profile,
  materialProfile: recipe.strategyKeys.material,
})
