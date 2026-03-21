import { createFieldSpec } from './fieldSpec.js'

const windcrestSource = `({
  name: 'Windcrest Pine',
  description: 'A narrow pine shaped by wind pressure and leader competition.',
  basePresetName: 'Pine',
  baseKind: 'tree',
  defaults: {
    windStrength: 0.66,
    crownCompression: 0.42,
    leaderLift: 0.78,
    branchShear: 0.48,
    height: 42,
    radius: 0.9,
    leaderCount: 1,
    leaderSplitChance: 0.1,
    leaderUpwardBias: 1.6,
    leaderDominance: 1.15,
    branchOutwardBias: 0.55,
    branchCrowdingPenalty: 0.18,
  },
  generate({ params, helpers }) {
    const wind = params.windStrength ?? 0.5
    const crown = params.crownCompression ?? 0.5
    const lift = params.leaderLift ?? 0.5
    const shear = params.branchShear ?? 0.5

    return {
      paramsPatch: {
        height: helpers.mix(36, 52, 1 - (wind * 0.35)),
        radius: helpers.mix(1.05, 0.72, crown),
        leaderCount: wind > 0.45 ? 1 : 0,
        leaderSplitChance: helpers.mix(0.08, 0.24, lift),
        leaderUpwardBias: helpers.mix(1.2, 1.9, lift),
        leaderDominance: helpers.mix(0.95, 1.22, lift),
        branchOutwardBias: helpers.mix(0.42, 0.76, shear),
        branchCrowdingPenalty: helpers.mix(0.12, 0.28, shear),
        trunkUprightStrength: helpers.mix(0.94, 0.72, wind),
        trunkNoiseDamping: helpers.mix(0.94, 0.7, wind),
        trunkLeanLimit: helpers.mix(0.08, 0.24, wind),
      },
    }
  },
})`

const lanternSource = `({
  name: 'Lantern Oak',
  description: 'A broad oak with lantern-like canopy gaps and measured scaffold breadth.',
  basePresetName: 'Oak',
  baseKind: 'tree',
  defaults: {
    canopySpread: 0.62,
    lanternGap: 0.34,
    scaffoldMass: 0.78,
    branchLift: 0.52,
    height: 34,
    radius: 1.12,
    leaderCount: 2,
    leaderSplitChance: 0.44,
    leaderDominance: 0.84,
    branchOutwardBias: 0.44,
  },
  generate({ params, helpers }) {
    const spread = params.canopySpread ?? 0.5
    const gap = params.lanternGap ?? 0.3
    const mass = params.scaffoldMass ?? 0.5
    const lift = params.branchLift ?? 0.5

    return {
      paramsPatch: {
        height: helpers.mix(30, 42, 1 - (spread * 0.18)),
        radius: helpers.mix(0.9, 1.42, mass),
        leaderCount: helpers.mix(1, 3, mass) > 1.4 ? 2 : 1,
        leaderSplitChance: helpers.mix(0.22, 0.58, gap),
        leaderUpwardBias: helpers.mix(0.88, 1.14, lift),
        leaderDominance: helpers.mix(0.76, 0.98, mass),
        branchOutwardBias: helpers.mix(0.32, 0.58, spread),
        branchCrowdingPenalty: helpers.mix(0.2, 0.34, gap),
        branchAwarenessRadius: helpers.mix(6.8, 8.4, spread),
        trunkUprightStrength: helpers.mix(0.72, 0.58, spread),
      },
    }
  },
})`

const weepingSource = `({
  name: 'Weeping Cypress',
  description: 'A tall canopy with controlled droop and curtain-like branch falloff.',
  basePresetName: 'Cypress',
  baseKind: 'tree',
  defaults: {
    curtainDrop: 0.72,
    tipFeather: 0.56,
    leaderCascade: 0.44,
    trunkStraightness: 0.84,
    height: 46,
    radius: 0.82,
    leaderCount: 2,
    leaderSplitChance: 0.5,
    leaderDominance: 1.04,
    twigGravity: 1.5,
  },
  generate({ params, helpers }) {
    const drop = params.curtainDrop ?? 0.6
    const feather = params.tipFeather ?? 0.5
    const cascade = params.leaderCascade ?? 0.5
    const straight = params.trunkStraightness ?? 0.7

    return {
      paramsPatch: {
        height: helpers.mix(40, 54, 1 - (cascade * 0.14)),
        radius: helpers.mix(0.72, 0.96, straight),
        leaderCount: helpers.mix(1, 3, cascade) > 1.7 ? 2 : 1,
        leaderSplitChance: helpers.mix(0.28, 0.64, cascade),
        leaderUpwardBias: helpers.mix(1.1, 1.72, straight),
        leaderLengthBias: helpers.mix(0.92, 1.12, straight),
        leaderDominance: helpers.mix(0.82, 1.18, straight),
        branchOutwardBias: helpers.mix(0.18, 0.36, feather),
        twigGravity: helpers.mix(1.1, 1.85, drop),
        twigPhototropism: helpers.mix(-0.2, 0.45, feather),
        branchCrowdingPenalty: helpers.mix(0.08, 0.2, drop),
      },
    }
  },
})`

const mossSource = `({
  name: 'Moss Shrub',
  description: 'A compact mossy shrub with dense occupancy-aware branching.',
  basePresetName: 'Bush',
  baseKind: 'bush',
  defaults: {
    mossBloom: 0.74,
    compactness: 0.68,
    leafClumpSize: 0.58,
    height: 11,
    radius: 0.42,
    leafCount: 9000,
    leafSize: 0.26,
    leaderCount: 0,
    branchAwarenessRadius: 8.5,
  },
  generate({ params, helpers }) {
    const moss = params.mossBloom ?? 0.5
    const compact = params.compactness ?? 0.5
    const clump = params.leafClumpSize ?? 0.5

    return {
      paramsPatch: {
        height: helpers.mix(8, 16, 1 - (compact * 0.22)),
        radius: helpers.mix(0.36, 0.58, moss),
        leafCount: Math.round(helpers.mix(7000, 12000, clump)),
        leafSize: helpers.mix(0.2, 0.34, clump),
        leaderCount: 0,
        recursion: 4,
        branchCrowdingPenalty: helpers.mix(0.22, 0.42, compact),
        branchCrowdedDeathChance: helpers.mix(0.12, 0.28, compact),
        branchOutwardBias: helpers.mix(0.26, 0.56, moss),
        mossAmount: helpers.mix(0.5, 1, moss),
      },
    }
  },
})`

export const BUILTIN_CUSTOM_SPECIMEN_DEFINITIONS = [
  {
    id: 'custom:windcrest-pine',
    name: 'Windcrest Pine',
    version: 1,
    builtIn: true,
    enabled: true,
    source: windcrestSource,
    description: 'A wind-bent pine with slim crown compression and strong leader lift.',
    basePresetName: 'Pine',
    baseKind: 'tree',
    defaults: {
      windStrength: 0.66,
      crownCompression: 0.42,
      leaderLift: 0.78,
      branchShear: 0.48,
    },
    controlSchema: [
      createFieldSpec({ path: 'params.windStrength', label: 'Wind Strength', widget: 'slider', group: 'Form', order: 10, min: 0, max: 1, step: 0.05, help: 'How much the crown bends away from the wind.' }),
      createFieldSpec({ path: 'params.crownCompression', label: 'Crown Compression', widget: 'slider', group: 'Form', order: 20, min: 0, max: 1, step: 0.05, help: 'How narrow the upper crown should stay.' }),
      createFieldSpec({ path: 'params.leaderLift', label: 'Leader Lift', widget: 'slider', group: 'Leaders', order: 10, min: 0, max: 1, step: 0.05, help: 'How strongly the leader axes rise above the trunk.' }),
      createFieldSpec({ path: 'params.branchShear', label: 'Branch Shear', widget: 'slider', group: 'Branches', order: 10, min: 0, max: 1, step: 0.05, help: 'How much the canopy skews sideways.' }),
    ],
  },
  {
    id: 'custom:lantern-oak',
    name: 'Lantern Oak',
    version: 1,
    builtIn: true,
    enabled: true,
    source: lanternSource,
    description: 'A broad oak with controlled canopy gaps and heavier scaffolding.',
    basePresetName: 'Oak',
    baseKind: 'tree',
    defaults: {
      canopySpread: 0.62,
      lanternGap: 0.34,
      scaffoldMass: 0.78,
      branchLift: 0.52,
    },
    controlSchema: [
      createFieldSpec({ path: 'params.canopySpread', label: 'Canopy Spread', widget: 'slider', group: 'Form', order: 10, min: 0, max: 1, step: 0.05, help: 'How far the crown opens outward.' }),
      createFieldSpec({ path: 'params.lanternGap', label: 'Lantern Gap', widget: 'slider', group: 'Branches', order: 10, min: 0, max: 1, step: 0.05, help: 'How much interior space is left between major limbs.' }),
      createFieldSpec({ path: 'params.scaffoldMass', label: 'Scaffold Mass', widget: 'slider', group: 'Leaders', order: 10, min: 0, max: 1, step: 0.05, help: 'How heavy the main structural arms feel.' }),
      createFieldSpec({ path: 'params.branchLift', label: 'Branch Lift', widget: 'slider', group: 'Branches', order: 20, min: 0, max: 1, step: 0.05, help: 'How much the branching plane lifts upward.' }),
    ],
  },
  {
    id: 'custom:weeping-cypress',
    name: 'Weeping Cypress',
    version: 1,
    builtIn: true,
    enabled: true,
    source: weepingSource,
    description: 'A tall cypress with curtain-like droop and restrained crown spread.',
    basePresetName: 'Cypress',
    baseKind: 'tree',
    defaults: {
      curtainDrop: 0.72,
      tipFeather: 0.56,
      leaderCascade: 0.44,
      trunkStraightness: 0.84,
    },
    controlSchema: [
      createFieldSpec({ path: 'params.curtainDrop', label: 'Curtain Drop', widget: 'slider', group: 'Foliage', order: 10, min: 0, max: 1, step: 0.05, help: 'How strongly the branch curtains fall.' }),
      createFieldSpec({ path: 'params.tipFeather', label: 'Tip Feather', widget: 'slider', group: 'Foliage', order: 20, min: 0, max: 1, step: 0.05, help: 'How soft the terminal growth feels.' }),
      createFieldSpec({ path: 'params.leaderCascade', label: 'Leader Cascade', widget: 'slider', group: 'Leaders', order: 10, min: 0, max: 1, step: 0.05, help: 'How often the main axis spawns descending leaders.' }),
      createFieldSpec({ path: 'params.trunkStraightness', label: 'Trunk Straightness', widget: 'slider', group: 'Form', order: 10, min: 0, max: 1, step: 0.05, help: 'How upright the central trunk remains.' }),
    ],
  },
  {
    id: 'custom:moss-shrub',
    name: 'Moss Shrub',
    version: 1,
    builtIn: true,
    enabled: true,
    source: mossSource,
    description: 'A compact, moss-rich shrub with dense occupancy-aware growth.',
    basePresetName: 'Bush',
    baseKind: 'bush',
    defaults: {
      mossBloom: 0.74,
      compactness: 0.68,
      leafClumpSize: 0.58,
    },
    controlSchema: [
      createFieldSpec({ path: 'params.mossBloom', label: 'Moss Bloom', widget: 'slider', group: 'Material', order: 10, min: 0, max: 1, step: 0.05, help: 'How heavily the shrub carries moss and softness.' }),
      createFieldSpec({ path: 'params.compactness', label: 'Compactness', widget: 'slider', group: 'Form', order: 10, min: 0, max: 1, step: 0.05, help: 'How tight and dense the form should stay.' }),
      createFieldSpec({ path: 'params.leafClumpSize', label: 'Leaf Clump Size', widget: 'slider', group: 'Foliage', order: 10, min: 0, max: 1, step: 0.05, help: 'How large the foliage clumps should be.' }),
    ],
  },
]

