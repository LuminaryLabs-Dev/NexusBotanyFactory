// Single source for the focused inspector: every visible slider is a real
// versioned species-contract field consumed by the production generator.
export const EDITOR_TRAIT_GROUPS = Object.freeze({
  character: ['featured'],
  shape: ['height', 'radius', 'taper', 'leaderCount', 'levels[0].lengthScale'],
  branches: ['levels[0].branchCount', 'levels[0].branchAngle', 'twigDensity', 'twigLength', 'twigGravity'],
  foliage: ['leafCount', 'leafSize'],
  advanced: ['simulationYears'],
})

export const getFieldsForTraitGroup = (fields, group) => {
  if (group === 'character') return fields.filter(field => field.featured)
  const keys = EDITOR_TRAIT_GROUPS[group] ?? []
  return fields.filter(field => keys.some(key => field.path === `params.${key}`))
}
