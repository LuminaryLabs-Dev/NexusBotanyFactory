import * as THREE from 'three'

export const getFallbackOrbitTarget = (params) => new THREE.Vector3(
  params.camTargetX ?? 0,
  params.camTargetY ?? (params.height / 2),
  params.camTargetZ ?? 0,
)

export const getSpecimenOrbitTarget = (params, treeData, estimatedHeight = null) => {
  if (treeData?.skeleton?.length) {
    const root = treeData.rootAnchor ?? treeData.skeleton[0]?.pos
    const bounds = new THREE.Box3()
    treeData.skeleton.forEach((bone) => bounds.expandByPoint(bone.pos))
    if (treeData.rootAnchor) {
      bounds.expandByPoint(treeData.rootAnchor)
    }
    if (root && !bounds.isEmpty()) {
      const height = estimatedHeight ?? bounds.getSize(new THREE.Vector3()).y
      return new THREE.Vector3(root.x, root.y + (height / 2), root.z)
    }
  }

  return getFallbackOrbitTarget(params)
}

export const getLandedOrbitTarget = (landedAnchor, estimatedHeight = 40) => {
  const anchor = landedAnchor instanceof THREE.Vector3
    ? landedAnchor.clone()
    : new THREE.Vector3(landedAnchor?.x ?? 0, landedAnchor?.y ?? 0, landedAnchor?.z ?? 0)

  return new THREE.Vector3(anchor.x, anchor.y + (estimatedHeight / 2), anchor.z)
}

export const getOrbitCameraPose = (params, target = getFallbackOrbitTarget(params)) => {
  const pitchRad = (params.camPitch ?? 15) * (Math.PI / 180)
  const yawRad = (params.camYaw ?? 45) * (Math.PI / 180)
  const distance = params.camDist ?? (params.height * 2.5)
  const orbitTarget = target.clone()

  return {
    position: new THREE.Vector3(
      orbitTarget.x + distance * Math.cos(pitchRad) * Math.sin(yawRad),
      orbitTarget.y + distance * Math.sin(pitchRad),
      orbitTarget.z + distance * Math.cos(pitchRad) * Math.cos(yawRad),
    ),
    target: orbitTarget,
  }
}

export const getAutoOrbitCameraPose = (target, estimatedHeight = 40) => {
  const orbitTarget = target.clone()
  const pitchRad = 18 * (Math.PI / 180)
  const yawRad = 38 * (Math.PI / 180)
  const distance = Math.max(36, estimatedHeight * 2.2)

  return {
    position: new THREE.Vector3(
      orbitTarget.x + distance * Math.cos(pitchRad) * Math.sin(yawRad),
      orbitTarget.y + distance * Math.sin(pitchRad),
      orbitTarget.z + distance * Math.cos(pitchRad) * Math.cos(yawRad),
    ),
    target: orbitTarget,
  }
}
