import * as THREE from 'three'
import { getNativeFoliageProfile } from './nativeFoliageProfiles.js'
import { getNativeFoliageTexture } from './nativeFoliageTexture.js'

// UV-aligned vertical bark ridges add close-view micro-relief without more triangles.
// The 128x256 bump map is shared by all woody meshes, and remains a material detail only.
let sharedBarkBump = null
export const getBarkBumpTexture = () => {
  if (sharedBarkBump) return sharedBarkBump
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 128; canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (let x = 0; x < 128; x += 3) {
    const shade = 80 + Math.round(105 * (0.5 + 0.5 * Math.sin(x * 0.34 + Math.sin(x * 0.09) * 2)))
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`
    ctx.lineWidth = 1 + (x % 4)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    for (let y = 0; y <= 256; y += 16) ctx.lineTo(x + Math.sin(y / 26 + x * 0.7) * 3, y)
    ctx.stroke()
  }
  sharedBarkBump = new THREE.CanvasTexture(canvas)
  sharedBarkBump.wrapS = THREE.RepeatWrapping
  sharedBarkBump.wrapT = THREE.RepeatWrapping
  sharedBarkBump.repeat.set(2, 5)
  return sharedBarkBump
}

export const createBarkMaterial = (recipe, {showStructure = false}={}) => new THREE.MeshStandardMaterial({
  color: showStructure ? '#ecfff1' : recipe.bark.barkColor,
  roughness: 0.95,
  metalness: 0,
  bumpMap: getBarkBumpTexture(),
  bumpScale: 0.045 + (recipe.bark.fiberIntensity ?? 0) * 0.02,
  wireframe: showStructure,
})

export const updateBarkMaterial = (material, recipe, {showStructure=false}={}) => {
  material.color.set(showStructure ? '#ecfff1' : recipe.bark.barkColor)
  material.roughness = 0.95
  material.bumpScale = 0.045 + (recipe.bark.fiberIntensity ?? 0) * 0.02
  material.wireframe = showStructure
}

// Alpha-tested species silhouettes avoid the old rectangular cards without adding
// any triangles: instanced leaves still occupy exactly two triangles per leaf.
export const createLeafMaterial = (materialRecipe, { showLeafDensity = false, speciesName = null, leafStyle = null, instanced = false } = {}) => {
  const profile = getNativeFoliageProfile(speciesName, leafStyle)
  const material = new THREE.MeshPhysicalMaterial({
    color: showLeafDensity ? '#7bd38e' : materialRecipe.foliage.leafColor,
    map: getNativeFoliageTexture(speciesName, leafStyle),
    side: THREE.DoubleSide,
    roughness: 0.69,
    metalness: 0,
    clearcoat: 0.07,
    clearcoatRoughness: 0.58,
    alphaTest: 0.32,
    transparent: showLeafDensity,
    opacity: showLeafDensity ? 0.65 : 1,
  })
  material.userData.nativeFoliageShape = profile.shape
  if (instanced) {
    const windTime = { value: 0 }
    const windStrength = { value: profile.wind }
    material.userData.nativeWindTime = windTime
    material.userData.nativeWindStrength = windStrength
    material.onBeforeCompile = (shader) => {
      shader.uniforms.nbfWindTime = windTime
      shader.uniforms.nbfWindStrength = windStrength
      shader.vertexShader = shader.vertexShader.replace('#include <common>',
        '#include <common>\nuniform float nbfWindTime;\nuniform float nbfWindStrength;')
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  float nbfPhase = nbfWindTime + instanceMatrix[3].x * 0.17 + instanceMatrix[3].z * 0.21;
  float nbfTip = clamp(position.y + 0.5, 0.0, 1.0);
  transformed.x += sin(nbfPhase) * nbfTip * nbfTip * nbfWindStrength * 0.09;
  transformed.z += cos(nbfPhase * 0.83) * nbfTip * nbfTip * nbfWindStrength * 0.055;
#endif`)
    }
    material.customProgramCacheKey = () => 'nbf-species-instanced-wind-v1'
  }
  return material
}

export const updateLeafMaterial = (material, materialRecipe, { showLeafDensity = false, speciesName = null, leafStyle = null } = {}) => {
  const profile = getNativeFoliageProfile(speciesName, leafStyle)
  material.color.set(showLeafDensity ? '#7bd38e' : materialRecipe.foliage.leafColor)
  material.map = getNativeFoliageTexture(speciesName, leafStyle)
  material.transparent = showLeafDensity
  material.opacity = showLeafDensity ? 0.65 : 1
  material.userData.nativeFoliageShape = profile.shape
  if (material.userData.nativeWindStrength) material.userData.nativeWindStrength.value = profile.wind
  material.needsUpdate = true
}
