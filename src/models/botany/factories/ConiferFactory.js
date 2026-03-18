import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'
import { ConiferGrowthStrategy } from '../strategies/BranchGrowthStrategy.js'

export class ConiferFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'conifer',
      specimenClass: TreeSpecimen,
      growthStrategy: new ConiferGrowthStrategy(),
    })
  }
}
