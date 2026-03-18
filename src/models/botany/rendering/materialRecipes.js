import * as THREE from 'three'

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

export const createLeafMaterial = (materialRecipe, { showLeafDensity = false } = {}) => new THREE.MeshStandardMaterial({
  color: showLeafDensity ? '#7bd38e' : materialRecipe.foliage.leafColor,
  side: THREE.DoubleSide,
  roughness: 0.8,
  transparent: showLeafDensity,
  opacity: showLeafDensity ? 0.55 : 1,
})

export const updateLeafMaterial = (material, materialRecipe, { showLeafDensity = false } = {}) => {
  material.color.set(showLeafDensity ? '#7bd38e' : materialRecipe.foliage.leafColor)
  material.transparent = showLeafDensity
  material.opacity = showLeafDensity ? 0.55 : 1
  material.needsUpdate = true
}
