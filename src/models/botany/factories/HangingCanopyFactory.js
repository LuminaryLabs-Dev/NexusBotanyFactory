import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { TreeSpecimen } from '../specimen/TreeSpecimen.js'

export class HangingCanopyFactory extends BaseBotanyFactory {
  constructor() {
    super({
      mode: 'broadleaf',
      specimenClass: TreeSpecimen,
    })
  }
}
