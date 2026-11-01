import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialParams, validateParams } from '../src/models/botany/validation/validation.js'

test('all five complete species presets validate', () => {
  for (const presetName of ['Pine', 'Oak', 'Willow', 'Birch', 'Cypress']) {
    const params = createInitialParams({ presetName, kind: 'tree', paramsPatch: { seed: 101 } })
    assert.deepEqual(validateParams(params), { valid: true, errors: [] }, presetName)
  }
})

test('partial and missing parameter documents fail without throwing', () => {
  for (const params of [undefined, {}, { recursion: 2, height: 9 }, { recursion: 2, levels: null }]) {
    const result = validateParams(params)
    assert.equal(result.valid, false)
    assert.ok(result.errors.length > 0)
  }
})

test('missing levels return a specific structured error', () => {
  const result = validateParams({ recursion: 3 })
  assert.ok(result.errors.some((error) => error.path === 'params.levels'))
})

test('invalid recursion against a short LOD hierarchy is rejected', () => {
  const params = createInitialParams({ presetName: 'Pine', kind: 'tree' })
  params.recursion = 5
  params.levels = params.levels.slice(0, 1)
  const result = validateParams(params)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.path === 'params.recursion'))
})
