import { createFieldSpec, normalizeFieldSpecs } from '../custom-specimens/fieldSpec.js'

const withGroup = (group, fields, visibleIn = ['build', 'refine', 'editor']) => normalizeFieldSpecs(fields.map((field) => ({ ...field, group, visibleIn })))

export const getBuildInspectorFields = () => [
  ...withGroup('Base Form', [
    createFieldSpec({ path: 'params.recursion', label: 'Branch Levels', widget: 'slider', min: 1, max: 5, step: 1, help: 'How many structural layers the specimen generates.' }),
    createFieldSpec({ path: 'params.height', label: 'Tree Height', widget: 'slider', min: 2, max: 80, step: 1, help: 'Overall specimen height in meters.' }),
    createFieldSpec({ path: 'params.radius', label: 'Trunk Thickness', widget: 'slider', min: 0.1, max: 5, step: 0.05, help: 'Base trunk thickness and mass.' }),
    createFieldSpec({ path: 'params.taper', label: 'Trunk Taper', widget: 'slider', min: 0.01, max: 1, step: 0.01, help: 'How quickly the trunk narrows upward.' }),
  ], ['build']),
  ...withGroup('Leader System', [
    createFieldSpec({ path: 'params.leaderCount', label: 'Leader Count', widget: 'slider', min: 0, max: 6, step: 1, help: 'How many dominant leader axes can emerge.' }),
    createFieldSpec({ path: 'params.leaderSplitChance', label: 'Leader Split Chance', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'Probability of a split becoming a leader.' }),
    createFieldSpec({ path: 'params.leaderUpwardBias', label: 'Leader Upward Bias', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How strongly leaders pull upward.' }),
    createFieldSpec({ path: 'params.leaderDominance', label: 'Leader Dominance', widget: 'slider', min: 0, max: 1.5, step: 0.05, help: 'How much the leaders compete with the main trunk.' }),
  ], ['build']),
  ...withGroup('Variation', [
    createFieldSpec({ path: 'params.seed', label: 'Seed', widget: 'slider', min: 0, max: 2147483647, step: 1, help: 'Random seed for procedural variation.' }),
    createFieldSpec({ path: 'params.leafCount', label: 'Leaf Density', widget: 'slider', min: 0, max: 25000, step: 100, help: 'How many leaf instances are emitted.' }),
    createFieldSpec({ path: 'params.leafSize', label: 'Leaf Scale', widget: 'slider', min: 0.05, max: 10, step: 0.01, help: 'Relative leaf size.' }),
  ], ['build']),
]

export const getRefineInspectorFields = () => [
  ...withGroup('True Trunk', [
    createFieldSpec({ path: 'params.trunkUprightStrength', label: 'Upright Bias', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How strongly the base trunk stays vertical.' }),
    createFieldSpec({ path: 'params.trunkNoiseDamping', label: 'Noise Damping', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How much sideways noise is reduced.' }),
    createFieldSpec({ path: 'params.trunkLeanLimit', label: 'Lean Limit', widget: 'slider', min: 0.02, max: 0.75, step: 0.01, help: 'Maximum allowable trunk lean.' }),
  ], ['refine']),
  ...withGroup('Leader Rules', [
    createFieldSpec({ path: 'params.leaderStartMin', label: 'Leader Start Min', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'Earliest relative point where a leader may emerge.' }),
    createFieldSpec({ path: 'params.leaderStartMax', label: 'Leader Start Max', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'Latest relative point where a leader may emerge.' }),
    createFieldSpec({ path: 'params.leaderThicknessRetention', label: 'Thickness Retention', widget: 'slider', min: 0.1, max: 1.5, step: 0.05, help: 'How much thickness leaders retain from the trunk.' }),
    createFieldSpec({ path: 'params.leaderLengthBias', label: 'Leader Length Bias', widget: 'slider', min: 0.2, max: 2, step: 0.05, help: 'How long leaders continue before tapering off.' }),
    createFieldSpec({ path: 'params.leaderInheritance', label: 'Leader Inheritance', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How much leader behavior is inherited from the trunk.' }),
    createFieldSpec({ path: 'params.leaderAwarenessRadius', label: 'Leader Awareness Radius', widget: 'slider', min: 0, max: 50, step: 0.1, help: 'How far leaders look ahead for competing axes.' }),
    createFieldSpec({ path: 'params.leaderProjectionLength', label: 'Projection Length', widget: 'slider', min: 0.1, max: 3, step: 0.05, help: 'How far leader corridors project ahead.' }),
    createFieldSpec({ path: 'params.leaderCorridorWidth', label: 'Corridor Width', widget: 'slider', min: 0.1, max: 5, step: 0.05, help: 'How wide leader competition corridors are.' }),
    createFieldSpec({ path: 'params.leaderRepulsionStrength', label: 'Leader Repulsion', widget: 'slider', min: 0, max: 3, step: 0.05, help: 'How strongly competing leaders push away.' }),
    createFieldSpec({ path: 'params.leaderParallelPenalty', label: 'Parallel Penalty', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'Penalty for near-parallel competing leaders.' }),
    createFieldSpec({ path: 'params.leaderRedundancyPenalty', label: 'Redundancy Penalty', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'Penalty for redundant structural axes.' }),
    createFieldSpec({ path: 'params.leaderYieldThreshold', label: 'Yield Threshold', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'Threshold for a weaker leader to yield.' }),
    createFieldSpec({ path: 'params.primaryLeaderProtection', label: 'Primary Protection', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How strongly the primary leader is protected.' }),
    createFieldSpec({ path: 'params.leaderGraceDistance', label: 'Grace Distance', widget: 'slider', min: 0, max: 30, step: 0.1, help: 'How long leaders are allowed to share space before competing.' }),
    createFieldSpec({ path: 'params.crownZoneSeparationStrength', label: 'Crown Separation', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How strongly leaders separate through the crown.' }),
  ], ['refine']),
  ...withGroup('Branch Awareness', [
    createFieldSpec({ path: 'params.branchAwarenessRadius', label: 'Awareness Radius', widget: 'slider', min: 0, max: 30, step: 0.1, help: 'How far branches sense nearby occupancy.' }),
    createFieldSpec({ path: 'params.branchExclusionRadius', label: 'Exclusion Radius', widget: 'slider', min: 0, max: 10, step: 0.05, help: 'Distance branches try to stay away from occupied space.' }),
    createFieldSpec({ path: 'params.branchRepulsionStrength', label: 'Repulsion Strength', widget: 'slider', min: 0, max: 3, step: 0.05, help: 'How strongly branches steer out of crowding.' }),
    createFieldSpec({ path: 'params.branchCrowdingPenalty', label: 'Crowding Penalty', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How much crowding slows growth.' }),
    createFieldSpec({ path: 'params.branchCrowdedDeathChance', label: 'Crowded Death Chance', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'Chance a crowded tip terminates instead of continuing.' }),
    createFieldSpec({ path: 'params.branchOutwardBias', label: 'Outward Escape Bias', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How strongly branches escape outward from the trunk.' }),
  ], ['refine']),
  ...withGroup('Terminal Growth', [
    createFieldSpec({ path: 'params.leafStyle', label: 'Leaf Style', widget: 'select', options: ['needle', 'broadleaf', 'hanging', 'shell'], help: 'Terminal foliage style.' }),
    createFieldSpec({ path: 'params.leafArrangement', label: 'Leaf Arrangement', widget: 'select', options: ['terminal', 'alternate', 'opposite'], help: 'How leaves are arranged along terminals.' }),
    createFieldSpec({ path: 'params.leafColor', label: 'Leaf Color', widget: 'color', help: 'Foliage tint.' }),
    createFieldSpec({ path: 'params.twigDensity', label: 'Twig Density', widget: 'slider', min: 0, max: 20, step: 1, help: 'How many twig points are emitted.' }),
    createFieldSpec({ path: 'params.twigLength', label: 'Twig Length', widget: 'slider', min: 0, max: 10, step: 0.1, help: 'Twig length budget.' }),
    createFieldSpec({ path: 'params.twigPhototropism', label: 'Twig Phototropism', widget: 'slider', min: -3, max: 3, step: 0.05, help: 'How strongly twigs bend toward light.' }),
    createFieldSpec({ path: 'params.twigGravity', label: 'Twig Gravity', widget: 'slider', min: -3, max: 3, step: 0.05, help: 'How strongly twigs droop or rise.' }),
  ], ['refine']),
  ...withGroup('Bark Material', [
    createFieldSpec({ path: 'params.barkColor', label: 'Base Color', widget: 'color', help: 'Primary bark color.' }),
    createFieldSpec({ path: 'params.barkTint', label: 'Branch Tint', widget: 'color', help: 'Secondary bark tint.' }),
    createFieldSpec({ path: 'params.fiberIntensity', label: 'Fiber', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How strongly bark fibers read.' }),
    createFieldSpec({ path: 'params.crackDepth', label: 'Cracks', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How deeply bark cracks show.' }),
    createFieldSpec({ path: 'params.mossAmount', label: 'Moss', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How much moss and softness to add.' }),
    createFieldSpec({ path: 'params.blendBias', label: 'Blend Bias', widget: 'slider', min: 0, max: 1, step: 0.05, help: 'How strongly the material blends color variation.' }),
    createFieldSpec({ path: 'params.roughnessVar', label: 'Roughness Variation', widget: 'slider', min: 0, max: 2, step: 0.05, help: 'How much surface roughness varies.' }),
  ], ['refine']),
]

export const getCustomInspectorFields = (definition) => normalizeFieldSpecs(definition?.controlSchema ?? [])

export const getLevelInspectorFields = (depth) => normalizeFieldSpecs([
  createFieldSpec({ path: `params.levels[${depth}].segments`, label: 'Resolution', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 3, max: 32, step: 1, help: 'How many segments this layer uses.' }),
  createFieldSpec({ path: `params.levels[${depth}].curve`, label: 'Curvature', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 4, step: 0.05, help: 'How curvy this branch layer becomes.' }),
  createFieldSpec({ path: `params.levels[${depth}].splitSmoothness`, label: 'Split Blending', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 2, step: 0.05, help: 'How softly splits blend apart.' }),
  createFieldSpec({ path: `params.levels[${depth}].branchCount`, label: 'Side Branch Count', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 20, step: 1, help: 'How many side branches are emitted.' }),
  createFieldSpec({ path: `params.levels[${depth}].branchAngle`, label: 'Branch Angle', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 3.14159, step: 0.01, help: 'How widely branches depart from the axis.' }),
  createFieldSpec({ path: `params.levels[${depth}].lengthScale`, label: 'Branch Length', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0.05, max: 1.5, step: 0.01, help: 'Relative branch length for the layer.' }),
  createFieldSpec({ path: `params.levels[${depth}].radiusScale`, label: 'Branch Thickness Falloff', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0.05, max: 1.5, step: 0.01, help: 'How much the branch thins as it grows.' }),
  createFieldSpec({ path: `params.levels[${depth}].apicalControl`, label: 'Apical Control', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 1, step: 0.05, help: 'How strongly this layer stays centered on its axis.' }),
  createFieldSpec({ path: `params.levels[${depth}].splitChance`, label: 'Split Chance', widget: 'slider', group: `Branch Layer ${depth + 1}`, visibleIn: ['refine'], min: 0, max: 1, step: 0.05, help: 'How often this layer splits into additional branches.' }),
])
