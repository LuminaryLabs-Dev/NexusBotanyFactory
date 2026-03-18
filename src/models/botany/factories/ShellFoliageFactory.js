import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'
import { ShellLeafPlacementStrategy } from '../strategies/LeafPlacementStrategy.js'

export class ShellFoliageFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: TreeSpecimen,
      leafPlacementStrategy: new ShellLeafPlacementStrategy(),
    })
  }
}
