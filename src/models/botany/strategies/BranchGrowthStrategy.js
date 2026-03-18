export class BaseGrowthStrategy {
  constructor() {
    this.registryKey = 'broadleaf'
  }

  getChildCount(baseCount, random) {
    return Math.max(0, Math.floor(baseCount + (random() * 0.5)))
  }

  getGoldenAngleMultiplier() {
    return 1
  }
}

export class ConiferGrowthStrategy extends BaseGrowthStrategy {
  constructor() {
    super()
    this.registryKey = 'conifer'
  }

  getGoldenAngleMultiplier() {
    return 2
  }
}

export class BroadleafGrowthStrategy extends BaseGrowthStrategy {}

export class BushGrowthStrategy extends BaseGrowthStrategy {
  constructor() {
    super()
    this.registryKey = 'bush'
  }

  getChildCount(baseCount, random) {
    return Math.max(0, Math.floor(baseCount + 1 + random()))
  }
}
