import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  getNativePresetCatalog, getNativeInspectorSpecs, getSpeciesContract,
  randomizeNativeParams, validateNativeParams, applyNativeEdit,
} from '../src/models/botany/schema/speciesContracts.js'
import { createInitialParams, validateParams } from '../src/models/botany/validation/validation.js'
import { createDefaultParams, createSchemaDocument } from '../src/models/botany/schema/schema.js'

const taxa = ['Pine', 'Oak', 'Willow', 'Birch', 'Cypress']
const featuredPaths = new Set()

test('built-in catalog remains complete when API returns only a partial catalog', () => {
  const full = getNativePresetCatalog([])
  assert.deepEqual(full.map(p => p.name), taxa)
  const partial = getNativePresetCatalog([{ id:'Pine', kind:'tree', name:'Pine', defaults:{ height:1 } }, {id:'custom:pine',kind:'custom',name:'Pine'}])
  assert.deepEqual(partial.map(p => p.name), taxa)
  assert.equal(partial[0].id, 'Pine', 'preserve known published preset ID')
  assert.equal(partial[1].id, 'builtin:oak', 'supply absent species from local authoritative contracts')
  assert.ok(full.every(p => p.kind === 'tree'))
  assert.equal(getNativePresetCatalog([{name:'Pine',kind:'tree'}]).length, 5)
})

test('each reference taxon exposes four different actual generator traits', () => {
  for (const name of taxa) {
    const contract = getSpeciesContract(name)
    assert.ok(contract)
    const fields = getNativeInspectorSpecs(name)
    const featured = fields.filter(f => f.featured)
    assert.equal(featured.length, 4, name)
    const signature = featured.map(f => f.path).join('|')
    assert.ok(!featuredPaths.has(signature), `identical signature bars for ${name}`)
    featuredPaths.add(signature)
    const params = createInitialParams({presetName:name, kind:'tree'})
    for (const f of featured) {
      const suffix=f.path.slice('params.'.length)
      assert.ok(contract.fields[suffix], `${name}: ${suffix} has no generator backing`)
      const current=suffix.replaceAll('[','.').replaceAll(']','').split('.').reduce((o,k)=>o?.[k],params)
      assert.ok(Number.isFinite(current))
      assert.ok(f.min <= current && current <= f.max, `${name}: ${suffix} starting value outside range`)
      assert.ok(f.label.length > 5)
    }
  }
})

test('schema advertises the same reference defaults and taxon identifiers as the generator', () => {
  const doc = createSchemaDocument()
  for (const name of taxa) {
    const summary=doc.presets.find(p=>p.name===name)
    const params=createDefaultParams(name)
    assert.ok(summary, name)
    assert.equal(summary.defaults.height, params.height)
    assert.equal(summary.defaults.radius, params.radius)
    assert.equal(summary.defaults.leafCount, params.leafCount)
    assert.equal(summary.taxonId, params.speciesId)
    assert.equal(summary.speciesContractVersion, params.speciesContractVersion)
  }
})

test('250 deterministic native randomizations enforce all coupled ranges and serialization', () => {
  for (const name of taxa) {
    const seedBase=createInitialParams({presetName:name,kind:'tree'})
    for(let seed=1;seed<=50;seed++){
      const value=randomizeNativeParams(seedBase,seed)
      assert.equal(value.seed,seed)
      assert.equal(value.name,name)
      assert.equal(value.speciesId,seedBase.speciesId)
      assert.deepEqual(value,randomizeNativeParams(seedBase,seed))
      assert.equal(validateParams(value).valid,true, `${name}:${seed} failed core validation`)
      assert.equal(validateNativeParams(value).valid,true, `${name}:${seed} failed native validation`)
      const loaded=JSON.parse(JSON.stringify({params:value}))
      assert.deepEqual(loaded.params,value)
    }
  }
})

test('native signature bars reject invalid changes and accept in-bound distinct values', () => {
  for(const name of taxa){
    const params=createInitialParams({presetName:name,kind:'tree'})
    const fields=getNativeInspectorSpecs(name).filter(f=>f.featured)
    for(const f of fields){
      const key=f.path.slice('params.'.length)
      const invalid=applyNativeEdit(params,key,f.max+1)
      assert.equal(invalid.accepted,false, `${name}: ${key} invalid range was accepted`)
      assert.equal(params.name,name)
      const changed=applyNativeEdit(params,key,f.min+(f.max-f.min)*0.4)
      assert.equal(changed.accepted,true, `${name}: ${key}: ${changed.error}`)
      assert.equal(validateNativeParams(changed.params).valid,true)
    }
  }
})

test('production code routes the main randomizer through native randomization and keeps a non-tree fallback',()=>{
  const editor=readFileSync(new URL('../src/views/editor/EditorScreen.jsx',import.meta.url),'utf8')
  const vm=readFileSync(new URL('../src/view-models/editorViewModel.js',import.meta.url),'utf8')
  const inspector=readFileSync(new URL('../src/views/editor/InspectorPanel.jsx',import.meta.url),'utf8')
  assert.match(editor,/editor\.specimen\.kind === 'tree' \? editor\.randomizeTree : editor\.randomizeSeed/)
  assert.match(vm,/getNativePresetCatalog\(presetCatalog\)/)
  assert.match(inspector,/getFieldsForTraitGroup/)
  assert.match(inspector,/role="tablist"/)
})
