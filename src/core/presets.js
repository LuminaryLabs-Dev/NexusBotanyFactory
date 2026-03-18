const baseLevels = [
  { segments: 20, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.3, splitSmoothness: 1.0 },
  { segments: 16, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.3, splitSmoothness: 1.0 },
  { segments: 12, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.3, splitSmoothness: 1.0 },
  { segments: 8, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.3, splitSmoothness: 1.0 },
  { segments: 4, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.3, splitSmoothness: 1.0 },
  { segments: 3, curve: 0.5, branchCount: 7, branchAngle: 1, lengthScale: 0.75, radiusScale: 0.7, apicalControl: 0.5, splitChance: 0.0, splitSmoothness: 1.0 },
]

const makePreset = (name, leafStyle, leafArrangement, leafColor, barkColor, barkTint, fiberIntensity, crackDepth, mossAmount, blendBias, roughnessVar, twigDensity, twigLength, twigPhototropism, twigGravity) => ({
  name,
  leafStyle,
  leafArrangement,
  seed: 108,
  height: 40,
  radius: 1.0,
  taper: 0.02,
  recursion: 3,
  leafCount: 5000,
  leafSize: 0.35,
  tropismUp: 1,
  gravity: 1,
  leafColor,
  barkColor,
  barkTint,
  fiberIntensity,
  crackDepth,
  mossAmount,
  blendBias,
  roughnessVar,
  twigDensity,
  twigLength,
  twigPhototropism,
  twigGravity,
  levels: JSON.parse(JSON.stringify(baseLevels)),
  camPitch: 15,
  camYaw: 45,
  camDist: 100,
  orbitMode: 'specimen-locked',
  camTargetX: 0,
  camTargetY: 21.25,
  camTargetZ: 0,
})

export const SPECIES_PRESETS = {
  Pine: makePreset('Pine', 'needle', 'alternate', '#1a3311', '#4a3320', '#6b4830', 0.8, 0.8, 0.1, 0.8, 0.7, 5, 1.2, 1.5, 0.1),
  Oak: makePreset('Oak', 'broadleaf', 'alternate', '#2d5a27', '#3a2e24', '#5c5248', 0.5, 0.9, 0.3, 0.4, 0.8, 3, 1.5, 0.8, 0.2),
  Willow: makePreset('Willow', 'hanging', 'alternate', '#8ca36f', '#4b4d3f', '#6b6e5b', 0.9, 0.3, 0.5, 0.3, 0.5, 2, 4.0, -0.5, 1.8),
  Birch: makePreset('Birch', 'broadleaf', 'alternate', '#a9c95d', '#d6d6d6', '#333333', 0.2, 0.2, 0.05, 0.9, 0.4, 4, 1.0, 0.6, 0.1),
  Cypress: makePreset('Cypress', 'shell', 'opposite', '#1e3d14', '#5c4b3f', '#786558', 0.7, 0.6, 0.2, 0.6, 0.6, 6, 0.5, 0.2, 0.05),
}

export const clonePresetParams = (presetName) => {
  const preset = SPECIES_PRESETS[presetName] ?? SPECIES_PRESETS.Pine
  return JSON.parse(JSON.stringify(preset))
}