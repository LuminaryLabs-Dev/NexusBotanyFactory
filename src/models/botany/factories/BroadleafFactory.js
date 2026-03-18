import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'
import { BroadleafGrowthStrategy } from '../strategies/BranchGrowthStrategy.js'

export class BroadleafFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: TreeSpecimen,
      growthStrategy: new BroadleafGrowthStrategy(),
    })
  }
}
