import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const source = new URL('../prototypes/sg03-native-webgl/editor.html', import.meta.url)
const html = readFileSync(source, 'utf8')
const sha = createHash('sha256').update(html).digest('hex')

test('SG-03 delivered editor has the validated exact content', () => {
  assert.equal(sha, 'e506af8243a3d6359b10605a6256f2248921b489a11cd270206375f6fee5cc83')
  assert.ok(html.startsWith('<!doctype html>'))
})

test('SG-03 source includes WebGL2 rendering and native taxon controls', () => {
  for (const required of [
    "getContext('webgl2'", 'class NativeWebGLTreeRenderer', 'nativeTraitContract',
    'nativeTraits', 'nativeTraitTaxon', 'nativeTraitVersion',
    'randomizeTree', 'exportLods', 'CATALOG_RECORDS', 'BASELINE',
  ]) assert.ok(html.includes(required), 'Missing feature: ' + required)
})

test('SG-03 source preserves published four LOD caps', () => {
  for (const cap of ['30000', '14500', '4500', '320']) {
    assert.ok(html.includes(cap), 'Missing documented cap ' + cap)
  }
})
