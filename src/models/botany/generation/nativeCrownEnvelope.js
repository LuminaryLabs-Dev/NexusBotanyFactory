// Authoring envelope: constrain oversized oak limbs without clipping all tips to
// a rigid cylinder. Dimensions are procedural, not normative species measurements.
export const getOakNativeCrownRadius = (height, y) => {
  if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(y)) return 0
  const t = Math.max(0, Math.min(1, y / height))
  return height * (0.34 + 0.30 * Math.sin(Math.PI * t))
}

export const getOakCrownSteering = (height, y, radialDistance) => {
  const allowed = getOakNativeCrownRadius(height, y)
  if (allowed <= 0 || !Number.isFinite(radialDistance)) return 0
  return Math.max(0, Math.min(0.94, (radialDistance / allowed - 0.70) * 2.6))
}
