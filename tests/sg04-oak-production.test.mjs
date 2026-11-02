import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialParams } from '../src/models/botany/validation/validation.js'
import { generateSpecimen } from '../src/models/botany/services/specimenGenerationService.js'

// Real factory tree, not the standalone SG-03 HTML renderer. Requires Three.js
// and is executed by the connected GitHub Actions npm-ci runner.
test('production white oak branches remain inside native crown envelope', () => {
  for (const seed of [101, 202]) {
    const params = createInitialParams({ presetName: 'Oak', kind: 'tree', paramsPatch: { seed } })
    const generated = generateSpecimen({ kind: 'tree', params, name: 'Oak Study' })
    assert.equal(generated.validation.valid, true)
    assert.ok(generated.treeData.nodes.length > 0)
    assert.ok(generated.treeData.leafInstances.length > 0)
    const maxBranchReach = Math.max(...generated.treeData.skeleton
      .filter((bone) => !bone.isTwig && bone.depth > 0)
      .map((bone) => Math.hypot(bone.pos.x, bone.pos.z)))
    assert.ok(Number.isFinite(maxBranchReach))
    assert.ok(maxBranchReach <= params.height * 0.641,
      `Oak seed ${seed}: overextended ${maxBranchReach}m on ${params.height}m tree`)
  }
})
