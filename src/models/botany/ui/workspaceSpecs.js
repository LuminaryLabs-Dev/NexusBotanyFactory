import { isFieldVisibleIn, normalizeFieldSpecs } from '../custom-specimens/fieldSpec.js'
import { getBuildInspectorFields, getCustomInspectorFields, getRefineInspectorFields } from './inspectorCatalog.js'

const normalizeKey = (value) => String(value ?? '').trim().toLowerCase()

const matchSectionIdFromGroup = (group, matchers) => {
  const normalized = normalizeKey(group)
  if (!normalized) return null

  for (const [sectionId, candidates] of Object.entries(matchers)) {
    if (candidates.includes(normalized)) {
      return sectionId
    }
  }

  return null
}

const fieldMapFromList = (fields) => new Map(fields.map((field) => [field.path, field]))

const sortFields = (fields) => [...fields].sort((left, right) => left.order - right.order)

const createSection = (spec, fields = []) => ({
  ...spec,
  fields: sortFields(fields),
})

const filterVisibleFields = (fields, workspaceId) => normalizeFieldSpecs(fields).filter((field) => isFieldVisibleIn(field, workspaceId))

const BUILD_GROUP_MATCHERS = {
  shape: ['shape', 'base form', 'form', 'base structure'],
  leaders: ['leaders', 'leader system', 'leader rules'],
  foliage: ['foliage', 'terminal growth', 'terminal'],
  variation: ['variation'],
}

const REFINE_GROUP_MATCHERS = {
  trueTrunk: ['true trunk', 'trunk'],
  leaderRules: ['leader rules', 'leader system', 'leaders'],
  branchAwareness: ['branch awareness', 'competition', 'branch competition'],
  terminalGrowth: ['terminal growth', 'foliage'],
  barkMaterial: ['bark material', 'bark', 'material'],
}

const WORKSPACE_SPECS = {
  build: {
    id: 'build',
    title: 'Build',
    description: 'Shape the specimen with the live preview.',
    layout: 'two-pane',
    sectionOrder: ['phenotype', 'shape', 'leaders', 'foliage', 'variation', 'customControls', 'previewHelp'],
  },
  refine: {
    id: 'refine',
    title: 'Refine',
    description: 'Tune structural and material behavior without the viewport.',
    layout: 'full-width',
    sectionOrder: ['trueTrunk', 'leaderRules', 'branchAwareness', 'terminalGrowth', 'barkMaterial', 'customControls', 'branchLayers'],
  },
  editor: {
    id: 'editor',
    title: 'Editor',
    description: 'Author custom specimen definitions and inspector metadata.',
    layout: 'full-width',
    sectionOrder: ['catalog', 'definition', 'inspectorFields', 'generatorSource', 'preview'],
  },
  library: {
    id: 'library',
    title: 'Library',
    description: 'Save and reload specimen studies.',
    layout: 'full-width',
    sectionOrder: ['save', 'current', 'assets'],
  },
}

const SECTION_SPECS = {
  phenotype: {
    id: 'phenotype',
    title: 'Phenotype',
    helper: 'Start with the species archetype and overall growth personality.',
    workspace: 'build',
    priority: 'primary',
    defaultExpanded: true,
    summary: 'Species and custom specimen selection.',
  },
  shape: {
    id: 'shape',
    title: 'Shape',
    helper: 'Set the specimen silhouette before deeper tuning.',
    workspace: 'build',
    priority: 'primary',
    defaultExpanded: true,
    summary: 'Height, taper, mass, and structural depth.',
    fieldPaths: ['params.recursion', 'params.height', 'params.radius', 'params.taper'],
  },
  leaders: {
    id: 'leaders',
    title: 'Leaders',
    helper: 'Control the dominant trunk-like axes that shape the crown.',
    workspace: 'build',
    priority: 'primary',
    defaultExpanded: true,
    summary: 'Leader count, competition, and upward pull.',
    fieldPaths: ['params.leaderCount', 'params.leaderSplitChance', 'params.leaderUpwardBias', 'params.leaderDominance'],
  },
  foliage: {
    id: 'foliage',
    title: 'Foliage',
    helper: 'Adjust the visible leaf mass without entering technical growth tuning.',
    workspace: 'build',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Leaf density and scale.',
    fieldPaths: ['params.leafCount', 'params.leafSize'],
  },
  variation: {
    id: 'variation',
    title: 'Variation',
    helper: 'Control the growth timeline, seed, and foliage density for this pine simulation.',
    workspace: 'build',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Timeline length, playback subdivision, seed, and foliage variation.',
    fieldPaths: ['params.seed', 'params.simulationYears', 'params.ticksPerYear', 'params.leafCount', 'params.leafSize'],
  },
  customControls: {
    id: 'customControls',
    title: 'Custom Controls',
    helper: 'Custom specimen controls that do not map to a built-in section.',
    workspace: 'build',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Custom inspector-driven controls.',
  },
  previewHelp: {
    id: 'previewHelp',
    title: 'Preview Help',
    helper: 'Orbit the specimen directly in the viewport with your mouse or trackpad.',
    workspace: 'build',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Viewport guidance only.',
  },
  trueTrunk: {
    id: 'trueTrunk',
    title: 'True Trunk',
    helper: 'Tune how strongly the base trunk stays upright and stable.',
    workspace: 'refine',
    priority: 'primary',
    defaultExpanded: true,
    summary: 'Trunk posture, damping, and lean.',
    fieldPaths: ['params.trunkUprightStrength', 'params.trunkNoiseDamping', 'params.trunkLeanLimit'],
  },
  leaderRules: {
    id: 'leaderRules',
    title: 'Leader Rules',
    helper: 'Control where leaders emerge and how they compete structurally.',
    workspace: 'refine',
    priority: 'primary',
    defaultExpanded: true,
    summary: 'Leader inheritance, projection, and competition.',
    fieldPaths: [
      'params.leaderStartMin',
      'params.leaderStartMax',
      'params.leaderThicknessRetention',
      'params.leaderLengthBias',
      'params.leaderInheritance',
      'params.leaderAwarenessRadius',
      'params.leaderProjectionLength',
      'params.leaderCorridorWidth',
      'params.leaderRepulsionStrength',
      'params.leaderParallelPenalty',
      'params.leaderRedundancyPenalty',
      'params.leaderYieldThreshold',
      'params.primaryLeaderProtection',
      'params.leaderGraceDistance',
      'params.crownZoneSeparationStrength',
    ],
  },
  branchAwareness: {
    id: 'branchAwareness',
    title: 'Branch Awareness',
    helper: 'Tune how branches sense crowding and push away from occupied space.',
    workspace: 'refine',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Crowding, repulsion, and escape behavior.',
    fieldPaths: [
      'params.branchAwarenessRadius',
      'params.branchExclusionRadius',
      'params.branchRepulsionStrength',
      'params.branchCrowdingPenalty',
      'params.branchCrowdedDeathChance',
      'params.branchOutwardBias',
    ],
  },
  terminalGrowth: {
    id: 'terminalGrowth',
    title: 'Terminal Growth',
    helper: 'Control twigs, foliage style, and terminal behavior.',
    workspace: 'refine',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Leaves, twigs, and terminal arrangement.',
    fieldPaths: [
      'params.leafStyle',
      'params.leafArrangement',
      'params.leafColor',
      'params.twigDensity',
      'params.twigLength',
      'params.twigPhototropism',
      'params.twigGravity',
    ],
  },
  barkMaterial: {
    id: 'barkMaterial',
    title: 'Bark Material',
    helper: 'Tune bark color and material breakup without changing the underlying generator.',
    workspace: 'refine',
    priority: 'secondary',
    defaultExpanded: true,
    summary: 'Bark tint, texture, and roughness.',
    fieldPaths: [
      'params.barkColor',
      'params.barkTint',
      'params.fiberIntensity',
      'params.crackDepth',
      'params.mossAmount',
      'params.blendBias',
      'params.roughnessVar',
    ],
  },
  branchLayers: {
    id: 'branchLayers',
    title: 'Branch Layers',
    helper: 'Primary and downstream branch tiers are tuned per layer below.',
    workspace: 'refine',
    priority: 'advanced',
    defaultExpanded: false,
    summary: 'Per-tier branch settings.',
  },
}

const buildSectionsFromSpec = (customDefinition) => {
  const baseFields = filterVisibleFields(getBuildInspectorFields(), 'build')
  const customFields = filterVisibleFields(getCustomInspectorFields(customDefinition), 'build')
  const fieldsByPath = fieldMapFromList(baseFields)

  const matchedCustom = {
    shape: [],
    leaders: [],
    foliage: [],
    variation: [],
  }
  const unmatchedCustom = []

  customFields.forEach((field) => {
    const matchedSectionId = matchSectionIdFromGroup(field.group, BUILD_GROUP_MATCHERS)
    if (matchedSectionId && matchedCustom[matchedSectionId]) {
      matchedCustom[matchedSectionId].push(field)
      return
    }
    unmatchedCustom.push(field)
  })

  const orderedSections = []
  orderedSections.push(createSection(SECTION_SPECS.phenotype))

  for (const sectionId of ['shape', 'leaders', 'foliage', 'variation']) {
    const spec = SECTION_SPECS[sectionId]
    const sectionFields = [
      ...(spec.fieldPaths ?? []).map((path) => fieldsByPath.get(path)).filter(Boolean),
      ...matchedCustom[sectionId],
    ]
    orderedSections.push(createSection(spec, sectionFields))
  }

  if (unmatchedCustom.length > 0) {
    orderedSections.push(createSection(SECTION_SPECS.customControls, unmatchedCustom))
  }

  orderedSections.push(createSection(SECTION_SPECS.previewHelp))

  return orderedSections
}

const refineSectionsFromSpec = (customDefinition) => {
  const baseFields = filterVisibleFields(getRefineInspectorFields(), 'refine')
  const customFields = filterVisibleFields(getCustomInspectorFields(customDefinition), 'refine')
  const fieldsByPath = fieldMapFromList(baseFields)

  const matchedCustom = {
    trueTrunk: [],
    leaderRules: [],
    branchAwareness: [],
    terminalGrowth: [],
    barkMaterial: [],
  }
  const unmatchedCustom = []

  customFields.forEach((field) => {
    const matchedSectionId = matchSectionIdFromGroup(field.group, REFINE_GROUP_MATCHERS)
    if (matchedSectionId && matchedCustom[matchedSectionId]) {
      matchedCustom[matchedSectionId].push(field)
      return
    }
    unmatchedCustom.push(field)
  })

  const orderedSections = ['trueTrunk', 'leaderRules', 'branchAwareness', 'terminalGrowth', 'barkMaterial'].map((sectionId) => {
    const spec = SECTION_SPECS[sectionId]
    return createSection(spec, [
      ...(spec.fieldPaths ?? []).map((path) => fieldsByPath.get(path)).filter(Boolean),
      ...matchedCustom[sectionId],
    ])
  })

  if (unmatchedCustom.length > 0) {
    orderedSections.push(createSection({
      ...SECTION_SPECS.customControls,
      workspace: 'refine',
      helper: 'Custom specimen controls that do not map to the built-in refine sections.',
    }, unmatchedCustom))
  }

  orderedSections.push(createSection(SECTION_SPECS.branchLayers))
  return orderedSections
}

export const getWorkspaceSpec = (workspaceId) => WORKSPACE_SPECS[workspaceId] ?? null

export const getBuildWorkspaceSections = (customDefinition) => buildSectionsFromSpec(customDefinition)

export const getRefineWorkspaceSections = (customDefinition) => refineSectionsFromSpec(customDefinition)
