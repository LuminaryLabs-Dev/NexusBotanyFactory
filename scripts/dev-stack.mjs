import process from 'node:process'
import { spawn } from 'node:child_process'

const children = []
let stopping = false

const shutdown = () => {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill('SIGTERM')
  }
}

const spawnProcess = (name, command, args, extraEnv = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  })
  children.push(child)
  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`)
    process.exitCode = 1
    shutdown()
  })
  child.on('exit', (code, signal) => {
    if (stopping) return
    console.error(`[${name}] exited (${signal ?? code ?? 'unknown'}); stopping dev stack.`)
    process.exitCode = code ?? 1
    shutdown()
  })
  return child
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const apiPort = process.env.NEXUS_BOTANY_API_PORT ?? '3002'
spawnProcess('api', npmCommand, ['run', 'dev:api'])
spawnProcess('web', npmCommand, ['run', 'dev'], {
  VITE_API_PROVIDER: 'rest',
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? `http://127.0.0.1:${apiPort}/api`,
})

process.on('SIGINT', () => {
  process.exitCode = 130
  shutdown()
})
process.on('SIGTERM', () => {
  process.exitCode = 143
  shutdown()
})
