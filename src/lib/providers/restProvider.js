const defaultApiBaseUrl = 'http://localhost:3002/api'

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl

const createUrl = (path) => `${getApiBaseUrl()}${path}`

const readJson = async (response) => {
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

const requestJson = async (path, options = {}) => {
  const response = await fetch(createUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Request failed with status ${response.status}.`)
  }
  return payload
}

export const restProvider = {
  getSchema: () => requestJson('/schema'),
  getCapabilities: () => requestJson('/capabilities'),
  listPresets: () => requestJson('/presets'),
  listAssets: () => requestJson('/assets'),
  createAsset: (body) => requestJson('/assets', { method: 'POST', body: JSON.stringify(body) }),
  updateAsset: (assetId, body) => requestJson(`/assets/${encodeURIComponent(assetId)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getAsset: (assetId) => requestJson(`/assets/${encodeURIComponent(assetId)}`),
  duplicateAsset: (assetId, name) => requestJson(`/assets/${encodeURIComponent(assetId)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  getAssetTreeData: (assetId) => requestJson(`/assets/${encodeURIComponent(assetId)}/tree-data`),
}
