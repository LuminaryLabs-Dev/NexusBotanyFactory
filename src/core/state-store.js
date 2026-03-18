import { clonePresetParams, SPECIES_PRESETS } from './presets.js'

export const createBotanyState = (presetName = 'Pine') => ({
  params: clonePresetParams(presetName),
  activePresetName: presetName in SPECIES_PRESETS ? presetName : 'Pine',
  savedConfigs: [],
})

export const patchParams = (state, patch) => ({
  ...state,
  params: {
    ...state.params,
    ...patch,
  },
})

export const patchLevel = (state, depth, patch) => {
  const levels = [...state.params.levels]
  levels[depth] = {
    ...levels[depth],
    ...patch,
  }

  return {
    ...state,
    params: {
      ...state.params,
      levels,
    },
  }
}

export const applyPresetByName = (state, presetName) => ({
  ...state,
  activePresetName: presetName in SPECIES_PRESETS ? presetName : 'Pine',
  params: clonePresetParams(presetName),
})

export const saveSpecimen = (state, name) => ({
  ...state,
  savedConfigs: [
    {
      id: Date.now().toString(),
      name,
      params: JSON.parse(JSON.stringify(state.params)),
    },
    ...state.savedConfigs,
  ],
})