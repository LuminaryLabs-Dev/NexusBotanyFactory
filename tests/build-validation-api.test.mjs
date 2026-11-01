import test from 'node:test'
import assert from 'node:assert/strict'
import { validateBuildHandler } from '../src/server/http/build-handlers.js'

const postValidation = (body, raw = false) => validateBuildHandler(new Request('http://127.0.0.1:3002/api/build/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: raw ? body : JSON.stringify(body),
}))

test('POST /api/build/validate returns 422 for incomplete parameters', async () => {
  const response = await postValidation({ params: { recursion: 3, height: 20 } })
  assert.equal(response.status, 422)
  const result = await response.json()
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.path === 'params.levels'))
})

test('POST /api/build/validate returns 422 for absent parameters', async () => {
  const response = await postValidation({})
  assert.equal(response.status, 422)
  const result = await response.json()
  assert.ok(result.errors.some((error) => error.path === 'params'))
})

test('POST /api/build/validate rejects malformed JSON with 400', async () => {
  const response = await postValidation('{', true)
  assert.equal(response.status, 400)
})
