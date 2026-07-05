import { getSpecimenOrbitTarget } from '../generation/camera.js'

export class CameraTargetStrategy {
  getOrbitTarget(params, treeData, estimatedHeight = null) {
    return getSpecimenOrbitTarget(params, treeData, estimatedHeight)
  }
}
