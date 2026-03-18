import { getSpecimenOrbitTarget } from '../generation/camera.js'

export class CameraTargetStrategy {
  getOrbitTarget(params, treeData) {
    return getSpecimenOrbitTarget(params, treeData)
  }
}
