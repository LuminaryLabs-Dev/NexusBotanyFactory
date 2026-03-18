import { clonePresetParams, SPECIES_PRESETS } from './presets.js'

export const DEFAULT_PRESET_NAME = 'Pine'
export const SUPPORTED_ASSET_KINDS = ['tree', 'shrub', 'bush']
export const LEAF_STYLE_ENUM = ['needle', 'broadleaf', 'hanging', 'shell']
export const LEAF_ARRANGEMENT_ENUM = ['terminal', 'alternate', 'opposite']
export const ORBIT_MODE_ENUM = ['specimen-locked']

export const BOTANY_PARAM_FIELD_SCHEMA = {
  name: { type: 'string', readOnly: true },
  seed: { type: 'integer', min: 0, max: 2147483647 },
  height: { type: 'number', min: 1, max: 120 },
  radius: { type: 'number', min: 0.05, max: 10 },
  taper: { type: 'number', min: 0, max: 1 },
  recursion: { type: 'integer', min: 0, max: 5 },
  leafStyle: { type: 'enum', values: LEAF_STYLE_ENUM },
  leafArrangement: { type: 'enum', values: LEAF_ARRANGEMENT_ENUM },
  leafCount: { type: 'integer', min: 0, max: 25000 },
  leafSize: { type: 'number', min: 0.05, max: 10 },
  tropismUp: { type: 'number', min: -5, max: 5 },
  gravity: { type: 'number', min: -5, max: 5 },
  barkColor: { type: 'color' },
  barkTint: { type: 'color' },
  leafColor: { type: 'color' },
  fiberIntensity: { type: 'number', min: 0, max: 2 },
  crackDepth: { type: 'number', min: 0, max: 2 },
  mossAmount: { type: 'number', min: 0, max: 1 },
  blendBias: { type: 'number', min: 0, max: 1 },
  roughnessVar: { type: 'number', min: 0, max: 2 },
  twigDensity: { type: 'integer', min: 0, max: 20 },
  twigLength: { type: 'number', min: 0, max: 10 },
  twigPhototropism: { type: 'number', min: -3, max: 3 },
  twigGravity: { type: 'number', min: -3, max: 3 },
  camPitch: { type: 'number', min: -89, max: 89 },
  camYaw: { type: 'number', min: -360, max: 360 },
  camDist: { type: 'number', min: 1, max: 500 },
  orbitMode: { type: 'enum', values: ORBIT_MODE_ENUM },
  camTargetX: { type: 'number', min: -10000, max: 10000 },
  camTargetY: { type: 'number', min: -10000, max: 10000 },
  camTargetZ: { type: 'number', min: -10000, max: 10000 },
  levels: { type: 'array', itemType: 'BotanyLevel', minItems: 1, maxItems: 6 },
}

export const BOTANY_LEVEL_FIELD_SCHEMA = {
  segments: { type: 'integer', min: 3, max: 32 },
  curve: { type: 'number', min: 0, max: 4 },
  branchCount: { type: 'integer', min: 0, max: 20 },
  branchAngle: { type: 'number', min: 0, max: 3.14159 },
  lengthScale: { type: 'number', min: 0.05, max: 1.5 },
  radiusScale: { type: 'number', min: 0.05, max: 1.5 },
  apicalControl: { type: 'number', min: 0, max: 1 },
  splitChance: { type: 'number', min: 0, max: 1 },
  splitSmoothness: { type: 'number', min: 0, max: 2 },
}

const makePresetSummary = ([name, params]) => ({
  id: name,
  name,
  kind: 'tree',
  leafStyle: params.leafStyle,
  leafArrangement: params.leafArrangement,
  defaults: {
    height: params.height,
    radius: params.radius,
    recursion: params.recursion,
    leafCount: params.leafCount,
  },
})

export const createDefaultParams = (presetName = DEFAULT_PRESET_NAME) => clonePresetParams(presetName)

export const createSchemaDocument = () => ({
  version: 1,
  defaultPresetName: DEFAULT_PRESET_NAME,
  supportedAssetKinds: SUPPORTED_ASSET_KINDS,
  presets: Object.entries(SPECIES_PRESETS).map(makePresetSummary),
  topLevelFields: BOTANY_PARAM_FIELD_SCHEMA,
  levelFields: BOTANY_LEVEL_FIELD_SCHEMA,
  examples: {
    createAsset: {
      name: 'Oak Study 01',
      kind: 'tree',
      presetName: 'Oak',
      tags: ['broadleaf', 'study'],
      params: {
        seed: 2048,
        height: 32,
        leafCount: 6500,
      },
    },
    patchAsset: {
      name: 'Oak Study 01 refined',
      tags: ['broadleaf', 'production'],
      params: {
        height: 36,
        radius: 1.25,
      },
    },
    patchCamera: {
      orbitMode: 'specimen-locked',
      camYaw: 120,
      camPitch: 18,
      camDist: 88,
      camTargetX: 0,
      camTargetY: 17.25,
      camTargetZ: 0,
    },
    patchLevel: {
      branchCount: 9,
      branchAngle: 1.25,
      splitChance: 0.35,
    },
  },
})