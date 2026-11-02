import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { deserializeGeneratedPayload } from '../models/botany/serialization/generatedPayload.js'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { buildGeneratedFromGrowthState } from '../models/botany/simulation/buildGeneratedFromGrowthState.js'
import { advancePineGrowthTick, initializePineGrowth, seekPineGrowth } from '../models/botany/simulation/pineGrowth.js'

const createExecutionState = () => {
  if (typeof window === 'undefined') {
    return 'main-thread'
  }

  return typeof Worker !== 'undefined' ? 'initializing' : 'main-thread'
}

const cloneSpecimenInput = (specimen, revision) => ({
  id: specimen.id,
  name: specimen.name,
  kind: specimen.kind,
  revision,
  presetId: specimen.presetId,
  customSpecimenId: specimen.customSpecimenId ?? null,
  customSpecimenVersion: specimen.customSpecimenVersion ?? null,
  customSpecimenSnapshot: structuredClone(specimen.customSpecimenSnapshot ?? null),
  tags: [...(specimen.tags ?? [])],
  params: structuredClone(specimen.params),
})

const createPlaybackState = () => ({
  playing: false,
  speed: 12,
  currentYear: 1,
  currentTickInYear: 0,
  absoluteTick: 0,
  totalTicks: 0,
  years: 20,
  ticksPerYear: 12,
  completed: false,
})

export const usePineSimulationViewModel = (specimen, revision) => {
  const generationInput = useMemo(
    () => cloneSpecimenInput(specimen, revision),
    [specimen, revision],
  )
  const deferredInput = useDeferredValue(generationInput)
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const mainThreadStateRef = useRef(null)
  const [executionState, setExecutionState] = useState(createExecutionState)
  const [state, setState] = useState({
    generated: null,
    pending: true,
    error: null,
    revision: 0,
    playback: createPlaybackState(),
  })

  const postWorkerMessage = (message) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    workerRef.current?.postMessage({ requestId, ...message })
    return requestId
  }

  useEffect(() => {
    if (specimen.params.name !== 'Pine') {
      queueMicrotask(() => setExecutionState('main-thread'))
      return undefined
    }
    if (executionState !== 'initializing') {
      return undefined
    }

    try {
      const worker = new Worker(new URL('../workers/pineGrowth.worker.js', import.meta.url), { type: 'module' })
      workerRef.current = worker
      worker.onmessage = (event) => {
        const { requestId, generated, error, revision: nextRevision } = event.data ?? {}
        if (requestId !== requestIdRef.current) return

        if (error) {
          setState((current) => ({
            ...current,
            pending: false,
            error,
            playback: { ...current.playback, playing: false },
          }))
          return
        }

        const nextGenerated = generated ? deserializeGeneratedPayload(generated) : null
        const simulation = nextGenerated?.simulation ?? createPlaybackState()
        setState((current) => ({
          ...current,
          generated: nextGenerated,
          pending: false,
          error: null,
          revision: nextRevision ?? current.revision,
          playback: {
            ...current.playback,
            ...simulation,
            years: specimen.params.simulationYears ?? simulation.years ?? current.playback.years,
            ticksPerYear: specimen.params.ticksPerYear ?? simulation.ticksPerYear ?? current.playback.ticksPerYear,
            playing: current.playback.playing && !simulation.completed,
          },
        }))
      }
      worker.onerror = () => {
        worker.terminate()
        workerRef.current = null
        setExecutionState('main-thread')
      }
      queueMicrotask(() => {
        setExecutionState('worker')
      })
      return () => {
        worker.terminate()
        workerRef.current = null
      }
    } catch {
      queueMicrotask(() => {
        setExecutionState('main-thread')
      })
      return undefined
    }
  }, [executionState, specimen.params.name, specimen.params.simulationYears, specimen.params.ticksPerYear])

  useEffect(() => {
    if (!deferredInput) return undefined
    let cancelled = false

    if (deferredInput.params.name === 'Pine' && executionState === 'worker' && workerRef.current) {
      queueMicrotask(() => {
        if (cancelled) return
        setState((current) => ({
          ...current,
          pending: true,
          error: null,
          playback: {
            ...current.playback,
            playing: false,
          },
        }))
      })
      postWorkerMessage({
        command: 'init',
        specimen: deferredInput,
        revision: deferredInput.revision ?? 0,
      })
      return () => {
        cancelled = true
      }
    }

    if (deferredInput.params?.name !== 'Pine') {
      try {
        const generated = generateSpecimen(deferredInput)
        queueMicrotask(() => {
          if (cancelled) return
          setState(current => ({...current,generated:generated.validation?.valid ? generated : null,
            pending:false,error:generated.validation?.valid ? null : generated.validation?.errors?.[0]?.message ?? 'Generation failed',
            revision:deferredInput.revision ?? current.revision,
            playback:{...current.playback,playing:false,completed:true,totalTicks:0,absoluteTick:0}}))
        })
      } catch(error) {
        queueMicrotask(() => {if(!cancelled)setState(current=>({...current,pending:false,error:error.message,generated:null}))})
      }
      return () => {cancelled=true}
    }
    const config = { params: deferredInput.params }
    const growthState = initializePineGrowth(config)
    mainThreadStateRef.current = growthState
    const generated = buildGeneratedFromGrowthState(deferredInput, growthState)
    queueMicrotask(() => {
      if (cancelled) return
      setState((current) => ({
        ...current,
        pending: false,
        generated,
        error: null,
        revision: deferredInput.revision ?? current.revision,
        playback: {
          ...current.playback,
          ...(generated.simulation ?? createPlaybackState()),
          playing: false,
        },
      }))
    })
    return () => {
      cancelled = true
    }
  }, [deferredInput, executionState])

  useEffect(() => {
    if (deferredInput.params?.name !== 'Pine') return undefined
    if (!state.playback.playing || state.pending || state.playback.completed) return undefined

    const intervalMs = Math.max(24, Math.round(1000 / Math.max(state.playback.speed, 1)))
    const intervalId = window.setInterval(() => {
      if (executionState === 'worker' && workerRef.current) {
        postWorkerMessage({
          command: 'step',
          revision: deferredInput.revision ?? 0,
        })
        return
      }

      const nextState = mainThreadStateRef.current
      if (!nextState) return
      advancePineGrowthTick(nextState, { params: deferredInput.params })
      const generated = buildGeneratedFromGrowthState(deferredInput, nextState)
      setState((current) => ({
        ...current,
        generated,
        pending: false,
        error: null,
        playback: {
          ...current.playback,
          ...(generated.simulation ?? createPlaybackState()),
          playing: !generated.simulation?.completed,
        },
      }))
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [deferredInput, executionState, state.pending, state.playback.completed, state.playback.playing, state.playback.speed])

  const reset = () => {
    setState((current) => ({
      ...current,
      pending: executionState === 'worker',
      playback: { ...current.playback, playing: false },
    }))

    if (executionState === 'worker' && workerRef.current) {
      postWorkerMessage({ command: 'reset', revision: deferredInput.revision ?? 0 })
      return
    }

    const nextState = initializePineGrowth({ params: deferredInput.params })
    mainThreadStateRef.current = nextState
    const generated = buildGeneratedFromGrowthState(deferredInput, nextState)
    setState((current) => ({
      ...current,
      pending: false,
      generated,
      error: null,
      playback: {
        ...current.playback,
        ...(generated.simulation ?? createPlaybackState()),
        playing: false,
      },
    }))
  }

  const stepForward = () => {
    setState((current) => ({
      ...current,
      pending: executionState === 'worker',
      playback: { ...current.playback, playing: false },
    }))

    if (executionState === 'worker' && workerRef.current) {
      postWorkerMessage({ command: 'step', revision: deferredInput.revision ?? 0 })
      return
    }

    const nextState = mainThreadStateRef.current
    if (!nextState) return
    advancePineGrowthTick(nextState, { params: deferredInput.params })
    const generated = buildGeneratedFromGrowthState(deferredInput, nextState)
    setState((current) => ({
      ...current,
      generated,
      pending: false,
      error: null,
      playback: {
        ...current.playback,
        ...(generated.simulation ?? createPlaybackState()),
        playing: false,
      },
    }))
  }

  const seekTick = (tick) => {
    const targetTick = Math.max(0, Math.min(Number(tick) || 0, state.playback.totalTicks))
    setState((current) => ({
      ...current,
      pending: executionState === 'worker',
      playback: { ...current.playback, playing: false },
    }))

    if (executionState === 'worker' && workerRef.current) {
      postWorkerMessage({ command: 'seek', tick: targetTick, revision: deferredInput.revision ?? 0 })
      return
    }

    const seededState = initializePineGrowth({ params: deferredInput.params })
    const nextState = seekPineGrowth(seededState, { params: deferredInput.params }, targetTick)
    mainThreadStateRef.current = nextState
    const generated = buildGeneratedFromGrowthState(deferredInput, nextState)
    setState((current) => ({
      ...current,
      generated,
      pending: false,
      error: null,
      playback: {
        ...current.playback,
        ...(generated.simulation ?? createPlaybackState()),
        playing: false,
      },
    }))
  }

  const setPlaying = (playing) => {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        playing: Boolean(playing) && !current.playback.completed,
      },
    }))
  }

  const setSpeed = (speed) => {
    setState((current) => ({
      ...current,
      playback: {
        ...current.playback,
        speed: Math.max(1, speed),
      },
    }))
  }

  return {
    generated: state.generated,
    pending: state.pending,
    error: state.error,
    revision: state.revision,
    playback: state.playback,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    reset,
    stepForward,
    seekTick,
    setSpeed,
  }
}
