import * as THREE from 'three'
import { createNoise2D } from '../generation/noise.js'

export const carveTerrainHeight = (x, z, noise) => {
  const ridgeAxis = (x * 0.0038) + (z * 0.0014)
  const ridgeNoise = noise((x * 0.0045) + 104, (z * 0.0045) - 62) * 18
  const carvedNoise = noise((x * 0.012) + 420, (z * 0.012) - 128) * 8.5
  const fineNoise = noise((x * 0.028) - 70, (z * 0.028) + 211) * 2.2
  const ridgeBands = Math.sin(ridgeAxis * 18) * 10.5
  const terraces = Math.round(((ridgeNoise + ridgeBands) / 5.25)) * 1.8
  const channels = -Math.pow(Math.abs(noise((x * 0.008) - 250, (z * 0.008) + 340)), 2.2) * 15
  const plateauMask = Math.exp(-(((x * x) + (z * z)) / (145 * 145)))
  const plantingRise = plateauMask * 5.8
  const plantingFlatten = plateauMask * ((ridgeNoise * 0.85) + ridgeBands + carvedNoise)
  return (ridgeNoise + ridgeBands + terraces + channels + carvedNoise + fineNoise + plantingRise) - plantingFlatten
}

export const getTerrainColor = (height, slope) => {
  const low = new THREE.Color('#769475')
  const mid = new THREE.Color('#91a886')
  const high = new THREE.Color('#b8b7a4')
  const moss = new THREE.Color('#638565')
  const sediment = new THREE.Color('#d9d3be')
  const heightMix = THREE.MathUtils.clamp((height + 24) / 58, 0, 1)
  const slopeMix = THREE.MathUtils.clamp(slope * 2.4, 0, 1)
  const base = low.clone().lerp(mid, heightMix).lerp(high, Math.max(0, heightMix - 0.45) * 1.6)
  base.lerp(moss, Math.max(0, 1 - slopeMix) * 0.28)
  base.lerp(sediment, slopeMix * 0.42)
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
    const y = carveTerrainHeight(x, z, noise)
    terrainGeo.attributes.position.setY(index, y)
    const dx = carveTerrainHeight(x + 3, z, noise) - y
    const dz = carveTerrainHeight(x, z + 3, noise) - y
    const slope = Math.sqrt((dx * dx) + (dz * dz)) / 3
    const color = getTerrainColor(y, slope)
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
