import process from 'node:process'
import { spawn } from 'node:child_process'

const children = []

const spawnProcess = (name, command, args, extraEnv = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
    },
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code
    }
  })

  children.push(child)
  return child
}

spawnProcess('api', 'npm', ['run', 'dev:api'])
spawnProcess('web', 'npm', ['run', 'dev'], {
  NEXT_PUBLIC_API_PROVIDER: 'rest',
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3002/api',
})

const shutdown = () => {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
