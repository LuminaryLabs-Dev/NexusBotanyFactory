import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'
import { HangingLeafPlacementStrategy } from '../strategies/LeafPlacementStrategy.js'

export class HangingCanopyFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: TreeSpecimen,
      leafPlacementStrategy: new HangingLeafPlacementStrategy(),
    })
  }
}
