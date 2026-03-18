import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { BushSpecimen } from '../specimen/BushSpecimen.js'
import { BushGrowthStrategy } from '../strategies/BranchGrowthStrategy.js'

export class BushFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: BushSpecimen,
      growthStrategy: new BushGrowthStrategy(),
    })
  }
}
