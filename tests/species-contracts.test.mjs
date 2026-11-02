import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialParams, validateParams } from '../src/models/botany/validation/validation.js'
import { SPECIES_CONTRACTS, createSpeciesDefaults, getSpeciesContract, validateNativeParams, applyNativeEdit, randomizeNativeParams, getNativeInspectorSpecs } from '../src/models/botany/schema/speciesContracts.js'

const taxa = ['Pine','Oak','Willow','Birch','Cypress']
const serialize = obj => JSON.parse(JSON.stringify(obj))

test('five unique, versioned taxon contracts with source provenance and schema-safe defaults', () => {
  assert.equal(Object.keys(SPECIES_CONTRACTS).length, 5)
  assert.equal(new Set(Object.values(SPECIES_CONTRACTS).map(c=>c.taxonId)).size, 5)
  for(const name of taxa){
    const params=createInitialParams({presetName:name,kind:'tree'})
    const c=getSpeciesContract(name)
    assert.equal(params.name,name)
    assert.equal(params.speciesId,c.taxonId)
    assert.equal(params.speciesContractVersion,1)
    assert.ok(c.sources.length)
    assert.equal(validateParams(params).valid,true,`global schema ${name}`)
    assert.equal(validateNativeParams(params).valid,true,`native schema ${name}`)
    assert.ok(getNativeInspectorSpecs(name).length>=10)
  }
})

test('coupled physical edits preserve trunk radius and species identity',()=>{
  for(const name of taxa){
    const params=createInitialParams({presetName:name,kind:'tree'})
    const before=params.radius/params.height
    const newHeight=getSpeciesContract(name).fields.height.min+2
    const updated=applyNativeEdit(params,'height',newHeight)
    assert.equal(updated.accepted,true,name+':'+updated.error)
    assert.ok(Math.abs(updated.params.radius/updated.params.height-before)<.003,name)
    assert.equal(updated.params.name,name)
    assert.equal(updated.params.speciesId,params.speciesId)
    assert.equal(validateNativeParams(updated.params).valid,true)
  }
})

test('reject out-of-contract parameter and impossible trunk radius',()=>{
  for(const name of taxa){
    const params=createInitialParams({presetName:name,kind:'tree'})
    const angle=getSpeciesContract(name).fields['levels[0].branchAngle']
    const before=serialize(params)
    assert.equal(applyNativeEdit(params,'levels[0].branchAngle',angle.max+.25).accepted,false)
    assert.deepEqual(params,before)
    assert.equal(applyNativeEdit(params,'radius',getSpeciesContract(name).fields.radius.max).accepted,false)
    assert.equal(validateNativeParams({...params,speciesId:'different-species'}).valid,false)
  }
})

test('15 deterministic, distinct taxon-preserving randomizations and saved JSON recipe reopens',()=>{
  for(const name of taxa){
    const base=createInitialParams({presetName:name,kind:'tree'})
    const signatures=new Set()
    for(const seed of [101,202,303]){
      const generated=randomizeNativeParams(base,seed)
      const repeated=randomizeNativeParams(base,seed)
      assert.deepEqual(generated,repeated)
      assert.equal(generated.speciesId,base.speciesId)
      assert.equal(generated.speciesContractVersion,1)
      assert.equal(validateParams(generated).valid,true)
      assert.equal(validateNativeParams(generated).valid,true)
      const saved=serialize({name:`${name} study`,params:generated})
      assert.deepEqual(saved.params,generated)
      assert.equal(validateNativeParams(saved.params).valid,true)
      signatures.add(`${generated.height}:${generated.radius}:${generated.levels[0].branchAngle}`)
    }
    assert.equal(signatures.size,3,name)
  }
})

test('species native ranges have units, bounded defaults, valid global levels and preserve legacy compatibility',()=>{
  for(const name of taxa){
    const c=getSpeciesContract(name)
    for(const [key,s] of Object.entries(c.fields)){
      assert.ok(s.unit,key)
      assert.ok(s.min<=s.typical && s.typical<=s.max,`${name}: ${key}`)
    }
    const legacy=createInitialParams({presetName:name,kind:'tree',paramsPatch:{leafCount:120,recursion:2,leaderCount:0}})
    assert.equal(validateParams(legacy).valid,true,`bounded legacy ${name}`)
    assert.equal(validateNativeParams(legacy).valid,false,`legacy natural bounds are advisory ${name}`)
  }
})

test('legacy migration is explicit, auditable and produces valid native ranges', async () => {
  const {normalizeLegacyToNative}=await import('../src/models/botany/schema/speciesContracts.js')
  for(const name of taxa){
    const legacy=createInitialParams({presetName:name,kind:'tree',paramsPatch:{leafCount:180,recursion:2,leaderCount:0,taper:.01}})
    const untouched=serialize(legacy)
    assert.equal(validateNativeParams(legacy).valid,false)
    const normalized=normalizeLegacyToNative(legacy)
    assert.ok(normalized.changes.length>=2)
    assert.equal(validateNativeParams(normalized.params).valid,true,`${name}: ${JSON.stringify(normalized.changes)}`)
    assert.deepEqual(legacy,untouched)
    assert.equal(normalized.params.speciesId,legacy.speciesId)
  }
})

test('the actual browser-provider normalization pathway preserves native saved recipe values',()=>{
  for (const name of taxa){
    const source=createInitialParams({presetName:name,kind:'tree'})
    const varied=randomizeNativeParams(source, 4242)
    const reopen=createInitialParams({presetName:name,kind:'tree',paramsPatch:serialize(varied)})
    assert.deepEqual(reopen,varied,`${name}: recipe roundtrip should not retype or overwrite parameters`)
    assert.equal(validateNativeParams(reopen).valid,true)
  }
})

test('production Build and Refine inspector fields have matching native contract paths and bounds', async()=>{
  const {getBuildWorkspaceSections}=await import('../src/models/botany/ui/workspaceSpecs.js')
  const {getLevelInspectorFields}=await import('../src/models/botany/ui/inspectorCatalog.js')
  const sections=getBuildWorkspaceSections(null)
  const shape=sections.find(x=>x.id==='shape')
  assert.ok(shape.fields.some(f=>f.path==='params.height'))
  assert.ok(shape.fields.some(f=>f.path==='params.radius'))
  const level0=getLevelInspectorFields(0)
  assert.ok(level0.some(f=>f.path==='params.levels[0].branchAngle'))
  assert.ok(level0.some(f=>f.path==='params.levels[0].branchCount'))
  for(const name of taxa){
    const fields=getNativeInspectorSpecs(name)
    assert.ok(fields.some(f=>f.path==='params.levels[0].branchAngle'))
    assert.ok(fields.every(f=>Number.isFinite(f.min) && Number.isFinite(f.max)))
  }
})
