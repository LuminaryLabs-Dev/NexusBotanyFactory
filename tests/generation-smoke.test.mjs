import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createInitialParams } from '../src/models/botany/validation/validation.js'
import { generateSpecimen } from '../src/models/botany/services/specimenGenerationService.js'

const species = ['Pine', 'Oak', 'Willow', 'Birch', 'Cypress']
const fingerprint = (treeData) => createHash('sha256').update(JSON.stringify({
  skeleton: treeData.skeleton.map((bone) => [
    bone.id, bone.parentId, bone.pos.x, bone.pos.y, bone.pos.z, bone.radius,
  ]),
  foliage: treeData.leafInstances.map((leaf) => [
    leaf.boneId, leaf.pos.x, leaf.pos.y, leaf.pos.z, leaf.angle,
  ]),
})).digest('hex')

test('ten bounded specimens generate stable geometry, foliage and four LOD descriptors', { timeout: 180000 }, () => {
  const results = []
  for (const presetName of species) {
    for (const seed of [101, 202]) {
      const params = createInitialParams({ presetName, kind: 'tree', paramsPatch: {
        seed, recursion: 2, leaderCount: 0, leafCount: 120,
      } })
      params.levels = params.levels.map((level) => ({
        ...level, segments: Math.min(level.segments, 6), branchCount: Math.min(level.branchCount, 3),
      }))
      const specimen = { kind: 'tree', name: `${presetName} ${seed}`, presetId: `builtin:${presetName.toLowerCase()}`, params }
      const first = generateSpecimen(specimen)
      assert.equal(first.validation?.valid, true, JSON.stringify(first.validation?.errors))
      assert.ok(first.treeData?.nodes?.length > 0, `${presetName} nodes`)
      assert.ok(first.treeData?.skeleton?.length > 0, `${presetName} skeleton`)
      assert.ok(first.treeData?.leafInstances?.length > 0, `${presetName} foliage`)
      assert.equal(first.treeAsset?.lods?.length, 4, `${presetName} LOD chain`)
      const second = generateSpecimen(specimen)
      assert.equal(fingerprint(first.treeData), fingerprint(second.treeData), `${presetName} seed ${seed}`)
      results.push({ presetName, seed, nodes: first.treeData.nodes.length,
        skeleton: first.treeData.skeleton.length, foliage: first.treeData.leafInstances.length })
    }
  }
  assert.equal(results.length, 10)
  console.log('NBF bounded 10-specimen generation:', JSON.stringify(results))
})
