import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'

export class ShellFoliageFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: TreeSpecimen,
    })
  }
}
