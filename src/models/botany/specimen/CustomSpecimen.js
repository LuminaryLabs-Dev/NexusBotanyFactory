import { BaseSpecimen } from './BaseSpecimen.js'
import { customSpecimenStore } from '../custom-specimens/store.js'

export class CustomSpecimen extends BaseSpecimen {
  constructor(input = {}) {
    const definition = customSpecimenStore.getDefinitionSync(
      input.customSpecimenId ?? input.presetId ?? input.definitionId,
      input.customSpecimenSnapshot ?? null,
    )

    super({
      ...input,
      kind: 'custom',
      customSpecimenId: input.customSpecimenId ?? definition?.id ?? null,
      customSpecimenVersion: input.customSpecimenVersion ?? definition?.version ?? null,
      customSpecimenSnapshot: input.customSpecimenSnapshot ?? (definition ? {
        id: definition.id,
        name: definition.name,
        version: definition.version,
        basePresetName: definition.basePresetName,
        baseKind: definition.baseKind,
        source: definition.source,
        controlSchema: definition.controlSchema,
        defaults: definition.defaults,
      } : null),
      extraFieldSchema: definition?.controlSchema ?? input.extraFieldSchema ?? [],
    })

    this.definition = definition
  }

  normalize() {
    const definition = customSpecimenStore.getDefinitionSync(this.customSpecimenId, this.customSpecimenSnapshot)
    if (!definition) {
      this.params = { ...this.params }
      return this
    }

    const mergedParams = customSpecimenStore.createCustomSpecimenParams(definition, this.params)
    this.definition = definition
    this.customSpecimenVersion = definition.version
    this.customSpecimenSnapshot = {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      basePresetName: definition.basePresetName,
      baseKind: definition.baseKind,
      source: definition.source,
      controlSchema: definition.controlSchema,
      defaults: definition.defaults,
    }
    this.extraFieldSchema = definition.controlSchema ?? []
    this.params = mergedParams
    return this
  }

  validate() {
    if (!this.definition) {
      return {
        valid: false,
        errors: [{ path: 'customSpecimenId', message: 'Missing custom specimen definition.', value: this.customSpecimenId }],
      }
    }

    if (this.definition.compileError) {
      return {
        valid: false,
        errors: [{ path: 'source', message: `Custom specimen source failed to compile: ${this.definition.compileError}`, value: this.definition.source ?? null }],
      }
    }

    if (!this.definition.runtime || typeof this.definition.runtime.generate !== 'function') {
      return {
        valid: false,
        errors: [{ path: 'source', message: 'Custom specimen source is not executable.', value: this.definition.source ?? null }],
      }
    }

    return super.validate()
  }
}
