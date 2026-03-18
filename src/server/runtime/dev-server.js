import http from 'node:http'
import { URL } from 'node:url'
import {
  applyPresetToAssetHandler,
  createAssetHandler,
  deleteAssetHandler,
  duplicateAssetHandler,
  getAssetCameraHandler,
  getAssetHandler,
  getAssetStatsHandler,
  getAssetTreeDataHandler,
  listAssetsHandler,
  patchAssetCameraHandler,
  patchAssetHandler,
  patchAssetLevelHandler,
  randomizeSeedHandler,
} from '../http/asset-handlers.js'
import {
  buildFromPresetAndPatchHandler,
  normalizeBuildHandler,
  validateBuildHandler,
} from '../http/build-handlers.js'
import {
  getCapabilitiesHandler,
  getHealthHandler,
  getSchemaHandler,
} from '../http/meta-handlers.js'
import {
  createPresetHandler,
  deletePresetHandler,
  getPresetHandler,
  listPresetsHandler,
  patchPresetHandler,
} from '../http/preset-handlers.js'
import { error } from '../http/responses.js'

const port = Number(process.env.NEXUS_BOTANY_API_PORT ?? 3002)
const host = process.env.NEXUS_BOTANY_API_HOST ?? '127.0.0.1'

const routes = [
  { method: 'GET', pattern: /^\/api\/health\/?$/, handler: getHealthHandler },
  { method: 'GET', pattern: /^\/api\/schema\/?$/, handler: getSchemaHandler },
  { method: 'GET', pattern: /^\/api\/capabilities\/?$/, handler: getCapabilitiesHandler },

  { method: 'GET', pattern: /^\/api\/presets\/?$/, handler: listPresetsHandler },
  { method: 'POST', pattern: /^\/api\/presets\/?$/, handler: createPresetHandler },
  { method: 'GET', pattern: /^\/api\/presets\/([^/]+)\/?$/, handler: getPresetHandler, params: ['presetId'] },
  { method: 'PATCH', pattern: /^\/api\/presets\/([^/]+)\/?$/, handler: patchPresetHandler, params: ['presetId'] },
  { method: 'DELETE', pattern: /^\/api\/presets\/([^/]+)\/?$/, handler: deletePresetHandler, params: ['presetId'] },

  { method: 'GET', pattern: /^\/api\/assets\/?$/, handler: listAssetsHandler },
  { method: 'POST', pattern: /^\/api\/assets\/?$/, handler: createAssetHandler },
  { method: 'GET', pattern: /^\/api\/assets\/([^/]+)\/?$/, handler: getAssetHandler, params: ['assetId'] },
  { method: 'PATCH', pattern: /^\/api\/assets\/([^/]+)\/?$/, handler: patchAssetHandler, params: ['assetId'] },
  { method: 'DELETE', pattern: /^\/api\/assets\/([^/]+)\/?$/, handler: deleteAssetHandler, params: ['assetId'] },
  { method: 'GET', pattern: /^\/api\/assets\/([^/]+)\/camera\/?$/, handler: getAssetCameraHandler, params: ['assetId'] },
  { method: 'PATCH', pattern: /^\/api\/assets\/([^/]+)\/camera\/?$/, handler: patchAssetCameraHandler, params: ['assetId'] },
  { method: 'GET', pattern: /^\/api\/assets\/([^/]+)\/stats\/?$/, handler: getAssetStatsHandler, params: ['assetId'] },
  { method: 'GET', pattern: /^\/api\/assets\/([^/]+)\/tree-data\/?$/, handler: getAssetTreeDataHandler, params: ['assetId'] },
  { method: 'POST', pattern: /^\/api\/assets\/([^/]+)\/duplicate\/?$/, handler: duplicateAssetHandler, params: ['assetId'] },
  { method: 'POST', pattern: /^\/api\/assets\/([^/]+)\/apply-preset\/?$/, handler: applyPresetToAssetHandler, params: ['assetId'] },
  { method: 'POST', pattern: /^\/api\/assets\/([^/]+)\/randomize-seed\/?$/, handler: randomizeSeedHandler, params: ['assetId'] },
  { method: 'PATCH', pattern: /^\/api\/assets\/([^/]+)\/levels\/([^/]+)\/?$/, handler: patchAssetLevelHandler, params: ['assetId', 'depth'] },

  { method: 'POST', pattern: /^\/api\/build\/validate\/?$/, handler: validateBuildHandler },
  { method: 'POST', pattern: /^\/api\/build\/normalize\/?$/, handler: normalizeBuildHandler },
  { method: 'POST', pattern: /^\/api\/build\/from-preset-and-patch\/?$/, handler: buildFromPresetAndPatchHandler },
]

const toNodeHeaders = (headers) => {
  const nextHeaders = {}
  headers.forEach((value, key) => {
    nextHeaders[key] = value
  })
  nextHeaders['access-control-allow-origin'] = '*'
  nextHeaders['access-control-allow-methods'] = 'GET,POST,PATCH,DELETE,OPTIONS'
  nextHeaders['access-control-allow-headers'] = 'Content-Type'
  return nextHeaders
}

const createWebRequest = async (request, origin) => {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
  return new Request(new URL(request.url, origin), {
    method: request.method,
    headers: request.headers,
    body,
  })
}

const matchRoute = (method, pathname) => {
  for (const route of routes) {
    if (route.method !== method) continue
    const match = pathname.match(route.pattern)
    if (!match) continue
    const params = Object.fromEntries((route.params ?? []).map((key, index) => [key, match[index + 1]]))
    return { handler: route.handler, params }
  }
  return null
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    const fallback = error(400, 'invalid_request', 'Request is missing a URL or method.')
    response.writeHead(fallback.status, toNodeHeaders(fallback.headers))
    response.end(await fallback.text())
    return
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'cache-control': 'no-store',
    })
    response.end()
    return
  }

  const origin = `http://${request.headers.host ?? `${host}:${port}`}`
  const { pathname } = new URL(request.url, origin)
  const matchedRoute = matchRoute(request.method, pathname)

  if (!matchedRoute) {
    const notFound = error(404, 'not_found', `No route found for ${request.method} ${pathname}.`)
    response.writeHead(notFound.status, toNodeHeaders(notFound.headers))
    response.end(await notFound.text())
    return
  }

  try {
    const webRequest = await createWebRequest(request, origin)
    const webResponse = await matchedRoute.handler(webRequest, { params: matchedRoute.params })
    response.writeHead(webResponse.status, toNodeHeaders(webResponse.headers))
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    const body = Buffer.from(await webResponse.arrayBuffer())
    response.end(body)
  } catch (caughtError) {
    const failed = error(500, 'internal_error', caughtError instanceof Error ? caughtError.message : 'Unknown server error.')
    response.writeHead(failed.status, toNodeHeaders(failed.headers))
    response.end(await failed.text())
  }
})

server.listen(port, host, () => {
  console.log(`NexusBotanyFactory API listening on http://${host}:${port}`)
})
