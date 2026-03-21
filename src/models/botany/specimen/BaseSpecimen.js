import {
  createInitialParams,
  extractCamera,
  normalizeAssetKind,
  normalizeTags,
  validateParams,
} from '../validation/validation.js'

export class BaseSpecimen {
  constructor(input = {}) {
    this.id = input.id ?? null
    this.name = input.name ?? 'Untitled Specimen'
    this.kind = normalizeAssetKind(input.kind)
    this.presetId = input.presetId ?? null
    this.customSpecimenId = input.customSpecimenId ?? null
    this.customSpecimenVersion = input.customSpecimenVersion ?? null
    this.customSpecimenSnapshot = input.customSpecimenSnapshot ?? null
    this.tags = normalizeTags(input.tags)
    this.createdAt = input.createdAt ?? null
    this.updatedAt = input.updatedAt ?? null
    this.params = input.params ?? createInitialParams({ presetName: input.presetName, kind: this.kind, paramsPatch: input.paramsPatch })
    this.extraFieldSchema = input.extraFieldSchema ?? []
  }

  normalize() {
    this.params = createInitialParams({
      presetName: this.params?.name ?? this.name,
      kind: this.kind,
      paramsPatch: this.params,
    })
    return this
  }

  validate() {
    return validateParams(this.params, this.extraFieldSchema)
  }

  get camera() {
    return extractCamera(this.params)
  }

  toPersistenceDocument() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      presetId: this.presetId,
      customSpecimenId: this.customSpecimenId,
      customSpecimenVersion: this.customSpecimenVersion,
      customSpecimenSnapshot: this.customSpecimenSnapshot,
      tags: this.tags,
      params: this.params,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
