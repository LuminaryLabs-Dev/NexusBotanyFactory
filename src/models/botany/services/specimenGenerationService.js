import { BroadleafFactory } from '../factories/BroadleafFactory.js'
import { BushFactory } from '../factories/BushFactory.js'
import { ConiferFactory } from '../factories/ConiferFactory.js'
import { HangingCanopyFactory } from '../factories/HangingCanopyFactory.js'
import { ShellFoliageFactory } from '../factories/ShellFoliageFactory.js'

const getFactoryKey = ({ kind, params }) => {
  if (kind === 'bush') return 'bush'
  if (params?.leafStyle === 'needle' || params?.name === 'Pine') return 'conifer'
  if (params?.leafStyle === 'hanging') return 'hanging'
  if (params?.leafStyle === 'shell') return 'shell'
  return 'broadleaf'
}

const factories = {
  broadleaf: new BroadleafFactory(),
  conifer: new ConiferFactory(),
  hanging: new HangingCanopyFactory(),
  shell: new ShellFoliageFactory(),
  bush: new BushFactory(),
}

export const getFactoryForSpecimen = (specimenLike) => factories[getFactoryKey(specimenLike)] ?? factories.broadleaf

export const generateSpecimen = (specimenLike) => getFactoryForSpecimen(specimenLike).generate(specimenLike)
