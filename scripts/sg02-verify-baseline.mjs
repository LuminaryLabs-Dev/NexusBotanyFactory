import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { generateSpecimen } from '../src/models/botany/services/specimenGenerationService.js'
import { deserializeGeneratedPayload } from '../src/models/botany/serialization/generatedPayload.js'
const root=path.resolve(process.argv[2] ?? 'sg02-output')
const sha=v=>createHash('sha256').update(v).digest('hex')
const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'))
if(manifest.specCount!==10||manifest.entries.length!==10)throw Error('Expected exactly ten assets')
const ids=new Set(), fingerprints=new Set()
for(const entry of manifest.entries){
  const raw=await readFile(path.join(root,entry.file),'utf8')
  if(sha(raw)!==entry.checksum)throw Error(`${entry.slug} file corrupted`)
  const doc=JSON.parse(raw)
  if(ids.has(doc.asset.id))throw Error(`duplicate ${doc.asset.id}`)
  ids.add(doc.asset.id)
  const restored=deserializeGeneratedPayload(doc.generated)
  if(!restored.treeData?.skeleton.length||restored.treeAsset?.lods.length!==4)throw Error(`${entry.slug} incomplete payload`)
  const rerun=generateSpecimen(doc.asset)
  const fp=generated=>sha(JSON.stringify({
    skeleton:generated.treeData.skeleton.map(b=>[b.id,b.parentId,b.pos.x,b.pos.y,b.pos.z,b.radius]),
    leaves:generated.treeData.leafInstances.map(l=>[l.boneId,l.pos.x,l.pos.y,l.pos.z,l.angle]),
    lods:generated.treeAsset.lods.map(l=>[l.level,l.representationType,l.budgets]),
  }))
  if(fp(restored)!==entry.fingerprint||fp(rerun)!==entry.fingerprint)throw Error(`Reopened ${entry.slug} differs`)
  fingerprints.add(entry.fingerprint)
  console.log(`REOPEN OK ${entry.slug}: ${entry.skeleton} bones / ${entry.foliage} leaves`)
}
if(fingerprints.size!==10)throw Error('Expected distinct fingerprints')
console.log('SG-02 reopen verification PASSED: 10/10 JSON assets, new process, native regeneration matches saved payloads')
