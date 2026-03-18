import { BaseSpecimen } from './BaseSpecimen.js'

export class ShrubSpecimen extends BaseSpecimen {
  constructor(input = {}) {
    super({ ...input, kind: 'shrub' })
  }
}
