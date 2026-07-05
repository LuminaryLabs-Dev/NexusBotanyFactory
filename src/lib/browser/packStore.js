const STORAGE_KEY = 'nexus-botany-factory.packs.v1'

let memoryPacks = []

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const clone = (value) => JSON.parse(JSON.stringify(value))

const readPacks = () => {
  if (!canUseBrowserStorage()) {
    return memoryPacks
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writePacks = (packs) => {
  const normalized = [...packs].sort((left, right) => {
    const leftTime = left.updatedAt ?? left.createdAt ?? ''
    const rightTime = right.updatedAt ?? right.createdAt ?? ''
    return rightTime.localeCompare(leftTime)
  })
  memoryPacks = normalized
  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }
  return normalized
}

const nowIso = () => new Date().toISOString()

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pack:${crypto.randomUUID()}`
  }
  return `pack:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export const createBlankPackDefinition = () => ({
  id: createId(),
  name: 'New Tree Pack',
  treeAssetIds: [],
  exportProfile: {
    id: 'unity-fbx-v1',
    label: 'Unity FBX v1',
  },
  status: 'draft',
  validation: {
    ready: false,
    issues: ['Pack needs 10 trees.'],
  },
})

export const packStore = {
  async list() {
    return { items: readPacks().map(clone) }
  },

  async create(definition) {
    const timestamp = nowIso()
    const next = {
      ...clone(definition),
      id: definition.id ?? createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    writePacks([next, ...readPacks()])
    return clone(next)
  },

  async update(packId, patch) {
    const packs = readPacks()
    const index = packs.findIndex((entry) => entry.id === packId)
    if (index < 0) throw new Error(`No pack found for id ${packId}.`)
    const next = {
      ...packs[index],
      ...clone(patch),
      updatedAt: nowIso(),
    }
    packs[index] = next
    writePacks(packs)
    return clone(next)
  },

  async delete(packId) {
    const packs = readPacks()
    const next = packs.filter((entry) => entry.id !== packId)
    writePacks(next)
    return { deleted: next.length !== packs.length, id: packId }
  },
}
