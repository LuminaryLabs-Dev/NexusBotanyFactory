import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const suppliedRoot = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
const root = resolve(suppliedRoot ?? '.')
const allowDirty = process.argv.includes('--allow-dirty')
const expectedSha = process.env.NBF_EXPECTED_SHA?.trim() || null
const expectedBranch = process.env.NBF_EXPECTED_BRANCH?.trim() || 'build'
const command = (file, args, cwd = root) => {
  try {
    return execFileSync(file, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

const gitRoot = command('git', ['rev-parse', '--show-toplevel'])
const localSha = gitRoot ? command('git', ['rev-parse', 'HEAD']) : null
const branch = gitRoot ? command('git', ['branch', '--show-current']) : null
const dirty = gitRoot ? command('git', ['status', '--porcelain=v1']) : null
const origin = gitRoot ? command('git', ['remote', 'get-url', 'origin']) : null
const originMatches = Boolean(origin && /(?:github\.com[:/])LuminaryLabs-Dev\/NexusBotanyFactory(?:\.git)?$/i.test(origin))
const hasPackage = existsSync(resolve(root, 'package.json'))
const lockPath = resolve(root, 'package-lock.json')
const hasLock = existsSync(lockPath)
const npm = process.platform === 'win32'
  ? command('cmd.exe', ['/d', '/s', '/c', 'npm --version'])
  : command('npm', ['--version'])
const problems = []
if (!gitRoot) problems.push('no_valid_git_checkout')
if (!npm) problems.push('npm_unavailable')
if (gitRoot && resolve(gitRoot) !== root) problems.push('not_at_checkout_root')
if (!hasPackage || !hasLock) problems.push('missing_package_or_lockfile')
if (gitRoot && !originMatches) problems.push('origin_does_not_match_project')
if (gitRoot && branch !== expectedBranch) problems.push('unexpected_branch')
if (expectedSha && localSha !== expectedSha) problems.push('source_sha_mismatch')
if (!allowDirty && dirty) problems.push('working_tree_dirty')

console.log(JSON.stringify({
  gate: 'SG-00/source-and-toolchain',
  status: problems.length ? 'blocked' : 'ready_for_npm_ci',
  root,
  git: {
    version: command('git', ['--version']),
    branch, sha: localSha, origin, originMatches,
    clean: dirty === '',
    changedFiles: dirty ? dirty.split('\n') : [],
  },
  toolchain: {
    node: process.version, npm,
    blender: command('blender', ['--version'])?.split('\n')[0] ?? null,
  },
  package: {
    present: hasPackage, lockfilePresent: hasLock,
    lockSha256: hasLock ? createHash('sha256').update(readFileSync(lockPath)).digest('hex') : null,
  },
  expectedBranch, expectedSha, problems,
  note: 'Read-only source check; npm ci, build, rendering and generation must run separately.',
}, null, 2))
if (problems.length) process.exitCode = 2
