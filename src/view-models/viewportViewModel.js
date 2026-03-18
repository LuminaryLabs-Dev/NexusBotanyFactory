import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { deserializeGeneratedPayload } from '../models/botany/serialization/generatedPayload.js'

const createWorkerState = () => {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return 'fallback'
  }

  return 'initializing'
}

const cloneSpecimenInput = (specimen) => ({
  id: specimen.id,
  name: specimen.name,
  kind: specimen.kind,
  revision: specimen.revision ?? 0,
  presetId: specimen.presetId,
  tags: [...(specimen.tags ?? [])],
  params: structuredClone(specimen.params),
})

export const useViewportViewModel = (specimen) => {
  const generationInput = useMemo(() => cloneSpecimenInput(specimen), [specimen])
  const deferredInput = useDeferredValue(generationInput)
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const [workerState, setWorkerState] = useState(createWorkerState)
  const [state, setState] = useState({
    generated: null,
    pending: true,
    error: null,
    revision: 0,
  })

  useEffect(() => {
    if (createWorkerState() !== 'initializing') {
      setWorkerState('fallback')
      return undefined
    }
    try {
      const worker = new Worker(new URL('../workers/specimenGeneration.worker.js', import.meta.url), { type: 'module' })
      workerRef.current = worker
      worker.onmessage = (event) => {
        const { requestId, generated, error, revision } = event.data ?? {}
        if (requestId !== requestIdRef.current) return

        if (error) {
          setState((current) => ({ ...current, pending: false, error }))
          return
        }

        setState({
          generated: deserializeGeneratedPayload(generated),
          pending: false,
          error: null,
          revision: revision ?? 0,
        })
      }
      worker.onerror = () => {
        worker.terminate()
        workerRef.current = null
        setWorkerState('fallback')
      }
      setWorkerState('worker')
    } catch {
      setWorkerState('fallback')
    }

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  // The worker is created once for the viewport session and torn down on unmount.
  }, [])

  useEffect(() => {
    if (!deferredInput) return undefined

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((current) => ({
      ...current,
      pending: true,
      error: null,
    }))

    if (workerState === 'worker' && workerRef.current) {
      workerRef.current.postMessage({ requestId, specimen: deferredInput })
      return undefined
    }

    if (workerState !== 'fallback') {
      return undefined
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      try {
        const generated = generateSpecimen(deferredInput)
        if (cancelled || requestId !== requestIdRef.current) return
        setState({
          generated,
          pending: false,
          error: null,
          revision: deferredInput.revision ?? 0,
        })
      } catch (error) {
        if (cancelled || requestId !== requestIdRef.current) return
        setState((current) => ({
          ...current,
          pending: false,
          error: error instanceof Error ? error.message : 'Specimen generation failed.',
        }))
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [deferredInput, workerState])

  return state
}
