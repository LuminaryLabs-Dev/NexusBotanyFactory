import { cloneRecipeByName } from '../recipes/speciesRecipes.js'
import { normalizePresetName } from '../validation/validation.js'

export const createSpecimenRecipe = (specimen, context = {}) => {
  const presetName = normalizePresetName(specimen?.params?.name ?? specimen?.name)
  const baseRecipe = cloneRecipeByName(presetName)

  return {
    ...baseRecipe,
    presetName,
    kind: specimen?.kind ?? 'tree',
    mode: context.mode ?? baseRecipe.mode,
    params: structuredClone(specimen?.params ?? baseRecipe.defaults),
    strategyKeys: {
      ...baseRecipe.strategyKeys,
      growth: context.growthStrategyKey ?? baseRecipe.strategyKeys.growth,
      leafPlacement: context.leafPlacementKey ?? baseRecipe.strategyKeys.leafPlacement,
      twig: context.twigStrategyKey ?? baseRecipe.strategyKeys.twig,
    },
  }
}
