import { serializeGeneratedPayload } from '../models/botany/serialization/generatedPayload.js'
import { buildGeneratedFromGrowthState } from '../models/botany/simulation/buildGeneratedFromGrowthState.js'
import { advancePineGrowthTick, initializePineGrowth, seekPineGrowth } from '../models/botany/simulation/pineGrowth.js'

let currentSpecimen = null
let currentConfig = null
let currentState = null
let checkpoints = new Map()

const storeCheckpoint = (state) => {
  checkpoints.set(state.absoluteTick, structuredClone(state))
}

const createSnapshot = () => serializeGeneratedPayload(buildGeneratedFromGrowthState(currentSpecimen, currentState))

const emitSnapshot = (requestId, revision) => {
  globalThis.postMessage({
    requestId,
    revision,
    generated: createSnapshot(),
  })
}

const resetWorkerState = (specimen) => {
  currentSpecimen = specimen
  currentConfig = {
    params: structuredClone(specimen?.params ?? {}),
  }
  currentState = initializePineGrowth(currentConfig)
  checkpoints = new Map()
  storeCheckpoint(currentState)
}

const findCheckpointTick = (targetTick) => {
  let best = 0
  checkpoints.forEach((_, tick) => {
    if (tick <= targetTick && tick >= best) {
      best = tick
    }
  })
  return best
}

globalThis.onmessage = (event) => {
  const { requestId, command, specimen, tick, revision } = event.data ?? {}

  try {
    switch (command) {
      case 'init':
        resetWorkerState(specimen)
        emitSnapshot(requestId, revision ?? specimen?.revision ?? 0)
        return
      case 'reset':
        resetWorkerState(currentSpecimen ?? specimen)
        emitSnapshot(requestId, revision ?? currentSpecimen?.revision ?? 0)
        return
      case 'step':
        if (!currentState) {
          resetWorkerState(specimen ?? currentSpecimen)
        }
        advancePineGrowthTick(currentState, currentConfig)
        if (currentState.absoluteTick % currentState.ticksPerYear === 0 || currentState.absoluteTick === currentState.totalTicks) {
          storeCheckpoint(currentState)
        }
        emitSnapshot(requestId, revision ?? currentSpecimen?.revision ?? 0)
        return
      case 'seek': {
        if (!currentState) {
          resetWorkerState(specimen ?? currentSpecimen)
        }
        const targetTick = Math.max(0, Math.min(Number(tick) || 0, currentState.totalTicks))
        const checkpointTick = findCheckpointTick(targetTick)
        const checkpoint = checkpoints.get(checkpointTick) ?? currentState
        currentState = seekPineGrowth(checkpoint, currentConfig, targetTick)
        storeCheckpoint(currentState)
        emitSnapshot(requestId, revision ?? currentSpecimen?.revision ?? 0)
        return
      }
      default:
        throw new Error(`Unknown pine growth worker command: ${command}`)
    }
  } catch (error) {
    globalThis.postMessage({
      requestId,
      revision: revision ?? currentSpecimen?.revision ?? 0,
      error: error instanceof Error ? error.message : 'Pine simulation failed.',
    })
  }
}

