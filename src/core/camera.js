import * as THREE from 'three'

export const getFallbackOrbitTarget = (params) => new THREE.Vector3(
  params.camTargetX ?? 0,
  params.camTargetY ?? (1.25 + (params.height / 2.0)),
  params.camTargetZ ?? 0,
)

export const getSpecimenOrbitTarget = (params, treeData) => {
  if (treeData?.skeleton?.length) {
    const bounds = new THREE.Box3()
    treeData.skeleton.forEach((bone) => bounds.expandByPoint(bone.pos))

    if (!bounds.isEmpty()) {
      return bounds.getCenter(new THREE.Vector3())
    }
  }

  return getFallbackOrbitTarget(params)
}

export const getOrbitCameraPose = (params, target = getFallbackOrbitTarget(params)) => {
  const pitchRad = (params.camPitch ?? 15) * (Math.PI / 180)
  const yawRad = (params.camYaw ?? 45) * (Math.PI / 180)
  const dist = params.camDist ?? (params.height * 2.5)
  const orbitTarget = target.clone()
  const x = orbitTarget.x + dist * Math.cos(pitchRad) * Math.sin(yawRad)
  const y = orbitTarget.y + dist * Math.sin(pitchRad)
  const z = orbitTarget.z + dist * Math.cos(pitchRad) * Math.cos(yawRad)

  return {
    position: new THREE.Vector3(x, y, z),
    target: orbitTarget,
  }
}