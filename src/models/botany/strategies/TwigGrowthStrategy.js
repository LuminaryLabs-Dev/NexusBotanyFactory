export class TwigGrowthStrategy {
  constructor() {
    this.registryKey = 'default'
  }

  getTotalTwigLength(params, anchorBone) {
    return (params.twigLength ?? 1) * anchorBone.radius * 6
  }
}
