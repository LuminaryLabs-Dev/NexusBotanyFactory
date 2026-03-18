import { BaseSpecimen } from './BaseSpecimen.js'

export class BushSpecimen extends BaseSpecimen {
  constructor(input = {}) {
    super({ ...input, kind: 'bush' })
  }
}
