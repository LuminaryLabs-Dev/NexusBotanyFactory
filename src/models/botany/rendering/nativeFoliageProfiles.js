// Shape profiles are visual approximations, not measured botanical limits.
// Keep these independent of Three.js so contract logic can be regression-tested.
const PROFILES = {
  Pine: { shape: 'needles', width: 0.62, height: 1.5, wind: 0.45 },
  Oak: { shape: 'oak-lobed', width: 1.05, height: 1.28, wind: 0.65 },
  Willow: { shape: 'lanceolate', width: 0.48, height: 1.75, wind: 1.4 },
  Birch: { shape: 'serrate', width: 0.82, height: 1.17, wind: 0.9 },
  Cypress: { shape: 'scales', width: 0.78, height: 1.32, wind: 0.3 },
}

export const getNativeFoliageProfile = (speciesName, fallbackStyle = 'broadleaf') =>
  PROFILES[speciesName] ?? (fallbackStyle === 'needle'
    ? PROFILES.Pine
    : fallbackStyle === 'hanging' ? PROFILES.Willow
      : fallbackStyle === 'shell' ? PROFILES.Cypress : PROFILES.Birch)

export const getNativeFoliageProfiles = () => structuredClone(PROFILES)
