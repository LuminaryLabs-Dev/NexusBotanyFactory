import { buildParamsFromRecipe, SPECIES_RECIPES } from '../recipes/speciesRecipes.js'

export { SPECIES_RECIPES }

export const SPECIES_PRESETS = Object.fromEntries(
  Object.entries(SPECIES_RECIPES).map(([name, recipe]) => [name, buildParamsFromRecipe(recipe)]),
)

export const clonePresetParams = (presetName) => structuredClone(SPECIES_PRESETS[presetName] ?? SPECIES_PRESETS.Pine)
