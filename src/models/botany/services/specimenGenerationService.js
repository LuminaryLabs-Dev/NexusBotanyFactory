import { CustomSpecimenFactory } from '../factories/CustomSpecimenFactory.js'
import { getFactoryForSpecimen as getBaseFactoryForSpecimen } from '../factories/factoryRegistry.js'

const getFactoryKey = ({ kind, params }) => {
  if (kind === 'custom' || params?.customSpecimenId) return 'custom'
  if (kind === 'bush') return 'bush'
  if (params?.leafStyle === 'needle' || params?.name === 'Pine') return 'conifer'
  if (params?.leafStyle === 'hanging') return 'hanging'
  if (params?.leafStyle === 'shell') return 'shell'
  return 'broadleaf'
}

const factories = {
  custom: new CustomSpecimenFactory(),
}

export const getFactoryForSpecimen = (specimenLike) => {
  if (getFactoryKey(specimenLike) === 'custom') {
    return factories.custom
  }

  return getBaseFactoryForSpecimen(specimenLike)
}

export const generateSpecimen = (specimenLike) => getFactoryForSpecimen(specimenLike).generate(specimenLike)
