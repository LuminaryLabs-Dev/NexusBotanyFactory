export class BaseGrowthStrategy {
  getChildCount(baseCount, random) {
    return Math.max(0, Math.floor(baseCount + (random() * 0.5)))
  }

  getGoldenAngleMultiplier() {
    return 1
  }
}

export class ConiferGrowthStrategy extends BaseGrowthStrategy {
  getGoldenAngleMultiplier() {
    return 2
  }
}

export class BroadleafGrowthStrategy extends BaseGrowthStrategy {}

export class BushGrowthStrategy extends BaseGrowthStrategy {
  getChildCount(baseCount, random) {
    return Math.max(0, Math.floor(baseCount + 1 + random()))
  }
}
