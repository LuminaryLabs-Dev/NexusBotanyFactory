export class LeafPlacementStrategy {
  constructor() {
    this.registryKey = 'default'
  }

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

export class HangingLeafPlacementStrategy extends LeafPlacementStrategy {
  constructor() {
    super()
    this.registryKey = 'hanging'
  }

  isAnchor({ params, depth, t }) {
    return depth >= Math.max(1, params.recursion - 2) && t > 0.2
  }
}

export class ShellLeafPlacementStrategy extends LeafPlacementStrategy {
  constructor() {
    super()
    this.registryKey = 'shell'
  }

  isAnchor({ depth, t }) {
    return depth >= 1 && t > 0.12
  }
}
