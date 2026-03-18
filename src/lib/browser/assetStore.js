const STORAGE_KEY = 'nexus-botany-factory.assets.v2'

let memoryAssets = []

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readAssets = () => {
  if (!canUseBrowserStorage()) {
    return memoryAssets
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeAssets = (assets) => {
  const normalized = [...assets].sort((left, right) => {
    const leftTime = left.updatedAt ?? left.createdAt ?? ''
    const rightTime = right.updatedAt ?? right.createdAt ?? ''
    return rightTime.localeCompare(leftTime)
  })

  memoryAssets = normalized
  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

const nowIso = () => new Date().toISOString()

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `asset:${crypto.randomUUID()}`
  }

  return `asset:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

const clone = (value) => JSON.parse(JSON.stringify(value))

export const assetStore = {
  async list() {
    return { items: readAssets().map(clone) }
  },

  async get(assetId) {
    const asset = readAssets().find((item) => item.id === assetId)
    if (!asset) {
      throw new Error(`No asset found for id ${assetId}.`)
    }
    return clone(asset)
  },

  async create({ name, kind, tags = [], params, presetId = null }) {
    const timestamp = nowIso()
    const asset = {
      id: createId(),
      name,
      kind,
      presetId,
      tags,
      params: clone(params),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    writeAssets([asset, ...readAssets()])
    return clone(asset)
  },

  async update(assetId, patch) {
    const assets = readAssets()
    const index = assets.findIndex((item) => item.id === assetId)
    if (index < 0) {
      throw new Error(`No asset found for id ${assetId}.`)
    }

    const next = {
      ...assets[index],
      ...patch,
      params: patch.params ? clone(patch.params) : assets[index].params,
      updatedAt: nowIso(),
    }
    assets[index] = next
    writeAssets(assets)
    return clone(next)
  },

  async duplicate(assetId, name) {
    const current = await this.get(assetId)
    return this.create({
      name: typeof name === 'string' && name.trim() ? name.trim() : `${current.name} copy`,
      kind: current.kind,
      presetId: current.presetId,
      tags: current.tags,
      params: current.params,
    })
  },

  async delete(assetId) {
    const assets = readAssets()
    const next = assets.filter((item) => item.id !== assetId)
    writeAssets(next)
    return { deleted: next.length !== assets.length, id: assetId }
  },
}
