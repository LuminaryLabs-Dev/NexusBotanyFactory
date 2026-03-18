export class TwigGrowthStrategy {
  getTotalTwigLength(params, anchorBone) {
    return (params.twigLength ?? 1) * anchorBone.radius * 6
  }
}
