export class LeafPlacementStrategy {
  isAnchor({ params, depth, t }) {
    if (params.leafStyle === 'shell') {
      return depth >= 1
    }
    if (params.leafStyle === 'hanging') {
      return depth >= Math.max(1, params.recursion - 2) && t > 0.3
    }
    return depth >= Math.max(1, params.recursion - 1) && t > 0.5
  }
}
