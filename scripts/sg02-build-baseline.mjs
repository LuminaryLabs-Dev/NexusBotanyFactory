import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createInitialParams } from '../src/models/botany/validation/validation.js'
import { generateSpecimen } from '../src/models/botany/services/specimenGenerationService.js'
import { serializeGeneratedPayload, deserializeGeneratedPayload } from '../src/models/botany/serialization/generatedPayload.js'
import { buildTreeGeometry } from '../src/models/botany/generation/geometry.js'

const SPECIES = ['Pine','Oak','Willow','Birch','Cypress']
const SEEDS = [101,202]
const outputDir = path.resolve(process.argv[2] ?? 'sg02-output')
const sha256 = value => createHash('sha256').update(value).digest('hex')
const fingerprint = generated => sha256(JSON.stringify({
  skeleton: generated.treeData.skeleton.map(b => [b.id,b.parentId,b.pos.x,b.pos.y,b.pos.z,b.radius]),
  leaves: generated.treeData.leafInstances.map(l => [l.boneId,l.pos.x,l.pos.y,l.pos.z,l.angle]),
  lods: generated.treeAsset.lods.map(l => [l.level,l.representationType,l.budgets]),
}))
const json = value => JSON.stringify(value,null,2)+'\n'

await mkdir(path.join(outputDir,'specimens'),{recursive:true})
const entries=[]
for(const species of SPECIES) for(const seed of SEEDS){
  const slug=`${species.toLowerCase()}-${seed}`
  const params=createInitialParams({presetName:species,kind:'tree',paramsPatch:{seed,recursion:2,leaderCount:0,leafCount:180}})
  params.levels=params.levels.map(level=>({...level,segments:Math.min(level.segments,7),branchCount:Math.min(level.branchCount,4)}))
  const asset={id:`sg02:${slug}`,name:`${species} ${seed}`,kind:'tree',presetId:`builtin:${species.toLowerCase()}`,tags:['sg02','baseline',species.toLowerCase()],params}
  const generated=generateSpecimen(asset)
  if(!generated.validation?.valid||!generated.treeData?.skeleton?.length||!generated.treeData.leafInstances?.length||generated.treeAsset?.lods?.length!==4) throw Error(`${slug} failed native generation: ${JSON.stringify(generated.validation)}`)
  const repeat=generateSpecimen(asset)
  if(fingerprint(generated)!==fingerprint(repeat))throw Error(`Non deterministic regeneration: ${slug}`)
  const mesh=buildTreeGeometry(generated.treeData,{radialSegments:6})
  if(!mesh.getAttribute('position')?.count||!mesh.getIndex()?.count)throw Error(`Empty native mesh: ${slug}`)
  const payload=serializeGeneratedPayload(generated)
  const file=path.join('specimens',`${slug}.json`)
  await writeFile(path.join(outputDir,file),json({asset,generated:payload}))
  const stored=JSON.parse(await readFile(path.join(outputDir,file),'utf8'))
  const reopened=deserializeGeneratedPayload(stored.generated)
  if(fingerprint(reopened)!==fingerprint(generated))throw Error(`Serialization roundtrip changed data: ${slug}`)
  const entry={id:asset.id,slug,name:asset.name,species,seed,file,checksum:sha256(json({asset,generated:payload})),fingerprint:fingerprint(generated),
    skeleton:generated.treeData.skeleton.length,axes:generated.treeData.nodes.length,foliage:generated.treeData.leafInstances.length,
    meshVertices:mesh.getAttribute('position').count,meshTriangles:mesh.getIndex().count/3,
    lods:generated.treeAsset.lods.map(l=>({level:l.level,type:l.representationType,cardCount:l.leafCards?.length??0})),
    bounds:generated.treeAsset.bounds,pivot:generated.treeAsset.pivot}
  entries.push(entry)
  console.log(`${slug}: ${entry.axes} axes, ${entry.skeleton} bones, ${entry.foliage} leaves, ${entry.meshTriangles} triangles, 4 LODs OK`)
  mesh.dispose()
}
if(entries.length!==10||new Set(entries.map(x=>x.fingerprint)).size!==10)throw Error('Expected 10 unique specimens')
await writeFile(path.join(outputDir,'manifest.json'),json({version:1,kind:'NexusBotanyFactory SG-02 native baseline',
 source:'LuminaryLabs-Dev/NexusBotanyFactory',reference:process.env.GITHUB_SHA??'current checkout',
 parameterProfile:'bounded-reference-v1; recursion 2, 180 leaves, max 7 segments, max 4 branches',
 specCount:10,entries}))
console.log(`SG-02 baseline: ${entries.length} saved specimens + manifest written to ${outputDir}`)
