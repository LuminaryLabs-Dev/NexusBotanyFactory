import { BaseBotanyFactory } from './BaseBotanyFactory.js'
import { CustomSpecimen } from '../specimen/CustomSpecimen.js'
import { customSpecimenStore } from '../custom-specimens/store.js'
import { createCustomSpecimenApi } from '../custom-specimens/runtime.js'
import { createInitialParams } from '../validation/validation.js'
import { getFactoryForSpecimen } from './factoryRegistry.js'
import { BaseSpecimen } from '../specimen/BaseSpecimen.js'

export class CustomSpecimenFactory extends BaseBotanyFactory {
  constructor() {
    super({ mode: 'custom', specimenClass: CustomSpecimen })
  }

  generate(specimenInput) {
    const specimen = specimenInput instanceof CustomSpecimen ? specimenInput : this.createSpecimen(specimenInput)
    this.normalize(specimen)
    const validation = this.validate(specimen)
    if (!validation.valid) {
      return { specimen, validation, treeData: null, stats: null, orbitTarget: null, generationError: validation.errors?.[0]?.message ?? 'Custom specimen generation failed.' }
    }

    const definition = customSpecimenStore.getDefinitionSync(specimen.customSpecimenId, specimen.customSpecimenSnapshot)
    if (!definition || definition.compileError || !definition.runtime || typeof definition.runtime.generate !== 'function') {
      return {
        specimen,
        validation: {
          valid: false,
          errors: [{
            path: 'customSpecimenId',
            message: definition?.compileError
              ? `Custom specimen source failed to compile: ${definition.compileError}`
              : !definition
                ? 'No custom specimen definition found.'
                : 'Custom specimen source is not executable.',
            value: specimen.customSpecimenId,
          }],
        },
        treeData: null,
        stats: null,
        orbitTarget: null,
        generationError: definition?.compileError ?? 'Custom specimen source is not executable.',
      }
    }

    let patch = {}
    try {
      patch = definition.runtime.generate({
        specimen,
        params: specimen.params,
        controls: specimen.params,
        definition,
        helpers: createCustomSpecimenApi(),
      }) ?? {}
    } catch (error) {
      return {
        specimen,
        validation: {
          valid: false,
          errors: [{ path: 'source', message: error instanceof Error ? error.message : 'Custom specimen generation failed.', value: definition.id }],
        },
        treeData: null,
        stats: null,
        orbitTarget: null,
        customSpecimen: {
          id: definition.id,
          name: definition.name,
          version: definition.version,
          basePresetName: definition.basePresetName,
          baseKind: definition.baseKind,
          sourceHash: definition.sourceHash ?? null,
        },
        generationError: error instanceof Error ? error.message : 'Custom specimen generation failed.',
      }
    }

    const basePresetName = patch.basePresetName ?? definition.basePresetName ?? 'Pine'
    const baseKind = patch.baseKind ?? definition.baseKind ?? 'tree'
    const paramsPatch = patch.paramsPatch ?? {}
    try {
      const syntheticSpecimen = new BaseSpecimen({
        ...specimen.toPersistenceDocument(),
        kind: baseKind,
        presetId: definition.id,
        params: createInitialParams({
          presetName: basePresetName,
          kind: baseKind,
          paramsPatch,
        }),
      })

      const generated = getFactoryForSpecimen(syntheticSpecimen).generate(syntheticSpecimen)
      return {
        ...generated,
        customSpecimen: {
          id: definition.id,
          name: definition.name,
          version: definition.version,
          basePresetName,
          baseKind,
          sourceHash: definition.sourceHash ?? null,
        },
      }
    } catch (error) {
      return {
        specimen,
        validation: {
          valid: false,
          errors: [{ path: 'source', message: error instanceof Error ? error.message : 'Custom specimen generation failed.', value: definition.id }],
        },
        treeData: null,
        stats: null,
        orbitTarget: null,
        customSpecimen: {
          id: definition.id,
          name: definition.name,
          version: definition.version,
          basePresetName,
          baseKind,
          sourceHash: definition.sourceHash ?? null,
        },
        generationError: error instanceof Error ? error.message : 'Custom specimen generation failed.',
      }
    }
  }
}
