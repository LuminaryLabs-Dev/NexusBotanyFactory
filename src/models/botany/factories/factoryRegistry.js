import { BroadleafFactory } from './BroadleafFactory.js'
import { BushFactory } from './BushFactory.js'
import { ConiferFactory } from './ConiferFactory.js'
import { HangingCanopyFactory } from './HangingCanopyFactory.js'
import { ShellFoliageFactory } from './ShellFoliageFactory.js'

const factories = {
  broadleaf: new BroadleafFactory(),
  conifer: new ConiferFactory(),
  hanging: new HangingCanopyFactory(),
  shell: new ShellFoliageFactory(),
  bush: new BushFactory(),
}

const getFactoryKey = ({ kind, params }) => {
  if (kind === 'bush') return 'bush'
  if (params?.leafStyle === 'needle' || params?.name === 'Pine') return 'conifer'
  if (params?.leafStyle === 'hanging') return 'hanging'
  if (params?.leafStyle === 'shell') return 'shell'
  return 'broadleaf'
}

export const getFactoryForSpecimen = (specimenLike) => factories[getFactoryKey(specimenLike)] ?? factories.broadleaf
