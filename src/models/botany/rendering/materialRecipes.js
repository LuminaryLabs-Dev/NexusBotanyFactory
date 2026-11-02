import * as THREE from 'three'
import { getNativeFoliageProfile } from './nativeFoliageProfiles.js'
import { getNativeFoliageTexture } from './nativeFoliageTexture.js'

export const createBarkMaterial = (materialRecipe, { showStructure = false } = {}) => new THREE.MeshStandardMaterial({
  color: showStructure ? '#ecfff1' : materialRecipe.bark.barkColor,
  roughness: Math.max(0.25, 1 - (materialRecipe.bark.fiberIntensity * 0.2)),
  wireframe: showStructure,
})

export const updateBarkMaterial = (material, materialRecipe, { showStructure = false } = {}) => {
  material.color.set(showStructure ? '#ecfff1' : materialRecipe.bark.barkColor)
  material.roughness = Math.max(0.25, 1 - (materialRecipe.bark.fiberIntensity * 0.2))
  material.wireframe = showStructure
  material.needsUpdate = true
}

// Alpha-tested species silhouettes avoid the old rectangular cards without adding
// any triangles: instanced leaves still occupy exactly two triangles per leaf.
export const createLeafMaterial = (materialRecipe, { showLeafDensity = false, speciesName = null, leafStyle = null, instanced = false } = {}) => {
  const profile = getNativeFoliageProfile(speciesName, leafStyle)
  const material = new THREE.MeshStandardMaterial({
    color: showLeafDensity ? '#7bd38e' : materialRecipe.foliage.leafColor,
    map: getNativeFoliageTexture(speciesName, leafStyle),
    side: THREE.DoubleSide,
    roughness: 0.82,
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
