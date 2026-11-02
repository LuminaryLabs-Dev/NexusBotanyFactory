import test from 'node:test'
import assert from 'node:assert/strict'
import { getOakNativeCrownRadius, getOakCrownSteering } from '../src/models/botany/generation/nativeCrownEnvelope.js'
import { getNativeFoliageProfile, getNativeFoliageProfiles } from '../src/models/botany/rendering/nativeFoliageProfiles.js'

test('oak canopy envelope remains bounded and reaches a rounded middle', () => {
  for (const height of [18, 31, 42]) {
    const bottom = getOakNativeCrownRadius(height, 0)
    const center = getOakNativeCrownRadius(height, height / 2)
    const tip = getOakNativeCrownRadius(height, height)
    assert.ok(bottom < center)
    assert.ok(tip < center)
    assert.ok(Math.abs(center / height - .64) < 1e-9)
    assert.equal(getOakCrownSteering(height, height / 2, 0), 0)
    assert.ok(getOakCrownSteering(height, height / 2, center * 0.9) > 0)
    assert.ok(getOakCrownSteering(height, height / 2, center * 1.2) <= .94)
  }
  assert.equal(getOakNativeCrownRadius(0, 4), 0)
  assert.equal(getOakCrownSteering(20, NaN, 1), 0)
})

test('five reference species have genuinely distinct foliage silhouettes and wind response', () => {
  const profiles = getNativeFoliageProfiles()
  const shapes = new Set()
  const winds = new Set()
  for (const name of ['Pine', 'Oak', 'Willow', 'Birch', 'Cypress']) {
    const profile = getNativeFoliageProfile(name)
    assert.equal(profile.shape, profiles[name].shape)
    assert.ok(profile.width > 0 && profile.height > 0 && profile.wind > 0)
    shapes.add(profile.shape)
    winds.add(profile.wind)
  }
  assert.equal(shapes.size, 5)
  assert.equal(winds.size, 5)
  assert.equal(getNativeFoliageProfile('Unknown', 'needle').shape, 'needles')
})
