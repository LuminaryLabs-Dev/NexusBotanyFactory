import * as THREE from 'three'
import { createNoise2D } from '../generation/noise.js'

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1)
const smoothstep = (edge0, edge1, value) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - (2 * t))
}
const lerp = (start, end, amount) => start + ((end - start) * amount)

const getTerrainCenter = (terrainRecipe = {}) => ({
  x: terrainRecipe.terrainCenterX ?? 210,
  z: terrainRecipe.terrainCenterZ ?? -130,
})

const bandPeak = (distance, radius, width, height, sharpness = 2.4) => {
  if (height === 0) return 0
  const normalized = Math.abs(distance - radius) / Math.max(width, 1)
  return height * Math.exp(-Math.pow(normalized, sharpness))
}

const buildBowlBaseHeight = (distance, terrainRecipe = {}) => {
  const innerRadius = terrainRecipe.terrainInnerRadius ?? 260
  const smallRidgeRadius = terrainRecipe.terrainSmallRidgeRadius ?? 560
  const largeRidgeRadius = terrainRecipe.terrainLargeRidgeRadius ?? 980
  const outerRimRadius = terrainRecipe.terrainOuterRimRadius ?? 1440
  const innerDepth = terrainRecipe.terrainInnerDepth ?? -26
  const smallRidgeHeight = terrainRecipe.terrainSmallRidgeHeight ?? 12
  const largeRidgeHeight = terrainRecipe.terrainLargeRidgeHeight ?? 24
  const outerRimHeight = terrainRecipe.terrainOuterRimHeight ?? 42
  const slopeSharpening = terrainRecipe.terrainSlopeSharpening ?? 1.1

  const radialRatio = clamp01(distance / Math.max(outerRimRadius, 1))
  const bowlRise = Math.pow(radialRatio, 1.3 + (slopeSharpening * 0.18)) * (smallRidgeHeight * 0.65)
  const basinFlattening = clamp01(terrainRecipe.terrainBasinFlattening ?? 0.55)
  const flattenedInnerRadius = innerRadius * (0.18 + (basinFlattening * 0.12))
  const flattenTransition = innerRadius * (0.45 + (basinFlattening * 0.18))
  const flattenMask = smoothstep(flattenedInnerRadius, flattenTransition, distance)

  let height = innerDepth + bowlRise
  height += bandPeak(distance, smallRidgeRadius, Math.max(1, smallRidgeRadius * 0.18), smallRidgeHeight, 2.8)
  height += bandPeak(distance, largeRidgeRadius, Math.max(1, largeRidgeRadius * 0.16), largeRidgeHeight, 2.5)
  height += bandPeak(distance, outerRimRadius, Math.max(1, outerRimRadius * 0.14), outerRimHeight, 2.2)

  return lerp(innerDepth, height, flattenMask)
}

export const carveTerrainHeight = (x, z, noise, terrainRecipe = {}) => {
  const center = getTerrainCenter(terrainRecipe)
  const dx = x - center.x
  const dz = z - center.z
  const distance = Math.sqrt((dx * dx) + (dz * dz))

  const noiseAmplitude = terrainRecipe.terrainNoiseAmplitude ?? 8.5
  const noiseFrequency = terrainRecipe.terrainNoiseFrequency ?? 0.0018
  const microNoiseAmplitude = terrainRecipe.terrainMicroNoiseAmplitude ?? 2.6
  const microNoiseFrequency = terrainRecipe.terrainMicroNoiseFrequency ?? 0.009
  const basinFlattening = clamp01(terrainRecipe.terrainBasinFlattening ?? 0.55)
  const outerRimRadius = terrainRecipe.terrainOuterRimRadius ?? 1440

  const baseHeight = buildBowlBaseHeight(distance, terrainRecipe)
  const radialRatio = clamp01(distance / Math.max(outerRimRadius, 1))
  const noiseMask = 0.24 + (radialRatio * 0.76)
  const basinMask = 1 - smoothstep(
    (terrainRecipe.terrainInnerRadius ?? 260) * (0.18 + (basinFlattening * 0.12)),
    (terrainRecipe.terrainInnerRadius ?? 260) * (0.45 + (basinFlattening * 0.18)),
    distance,
  )

  const broadNoise = noise(
    ((dx * noiseFrequency) + 91.5),
    ((dz * noiseFrequency) - 44.25),
  ) * noiseAmplitude
  const ridgeNoise = noise(
    ((dx * (noiseFrequency * 2.4)) - 16.75),
    ((dz * (noiseFrequency * 2.4)) + 208.5),
  ) * (noiseAmplitude * 0.42)
  const microNoise = noise(
    ((dx * microNoiseFrequency) + 350.1),
    ((dz * microNoiseFrequency) - 118.6),
  ) * microNoiseAmplitude

  const centeredNoise = ((broadNoise * 0.7) + ridgeNoise + microNoise) * noiseMask
  const basinNoiseDampen = 1 - (basinMask * 0.72)

  return baseHeight + (centeredNoise * basinNoiseDampen)
}

export const getTerrainColor = (distance, slope, terrainRecipe = {}) => {
  const outerRimRadius = terrainRecipe.terrainOuterRimRadius ?? 1440
  const radialRatio = clamp01(distance / Math.max(outerRimRadius, 1))

  const basin = new THREE.Color('#5f7f58')
  const basinDark = new THREE.Color('#496a45')
  const shoulder = new THREE.Color('#8fa57e')
  const ridge = new THREE.Color('#b9b89b')
  const rim = new THREE.Color('#d8d1b7')
  const sediment = new THREE.Color('#efe4c9')

  const heightMix = smoothstep(0.1, 0.86, radialRatio)
  const rimMix = smoothstep(0.68, 1, radialRatio)
  const slopeMix = THREE.MathUtils.clamp(slope * 2.8, 0, 1)

  const base = basin.clone()
    .lerp(basinDark, Math.max(0, 0.35 - heightMix) * 0.7)
    .lerp(shoulder, heightMix * 0.55)
    .lerp(ridge, smoothstep(0.2, 0.64, radialRatio) * 0.32)
    .lerp(rim, rimMix * 0.62)

  base.lerp(sediment, slopeMix * 0.4 + rimMix * 0.16)
  return base
}

export const buildTerrainResources = (terrainRecipe = {}) => {
  const size = terrainRecipe.size ?? 2800
  const resolution = terrainRecipe.resolution ?? 180
  const seed = terrainRecipe.seed ?? 42
  const terrainGeo = new THREE.PlaneGeometry(size, size, resolution, resolution)
  terrainGeo.rotateX(-Math.PI / 2)
  const colorAttr = new THREE.BufferAttribute(new Float32Array(terrainGeo.attributes.position.count * 3), 3)
  terrainGeo.setAttribute('color', colorAttr)
  const noise = createNoise2D(seed)

  for (let index = 0; index < terrainGeo.attributes.position.count; index += 1) {
    const x = terrainGeo.attributes.position.getX(index)
    const z = terrainGeo.attributes.position.getZ(index)
    const height = carveTerrainHeight(x, z, noise, terrainRecipe)
    terrainGeo.attributes.position.setY(index, height)
    const dx = carveTerrainHeight(x + 3, z, noise, terrainRecipe) - height
    const dz = carveTerrainHeight(x, z + 3, noise, terrainRecipe) - height
    const slope = Math.sqrt((dx * dx) + (dz * dz)) / 3

    const center = getTerrainCenter(terrainRecipe)
    const distance = Math.sqrt(((x - center.x) * (x - center.x)) + ((z - center.z) * (z - center.z)))
    const color = getTerrainColor(distance, slope, terrainRecipe)
    colorAttr.setXYZ(index, color.r, color.g, color.b)
  }

  terrainGeo.computeVertexNormals()
  const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.02,
  })
  return { terrainGeo, terrainMaterial }
}
