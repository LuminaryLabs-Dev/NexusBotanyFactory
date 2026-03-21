import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { deserializeGeneratedPayload, serializeGeneratedPayload } from '../models/botany/serialization/generatedPayload.js'

const getGenerationRuntime = () => {
  const configuredRuntime = process.env.NEXT_PUBLIC_GENERATION_RUNTIME?.trim().toLowerCase()
  if (configuredRuntime === 'worker' || configuredRuntime === 'main-thread') {
    return configuredRuntime
  }

  return process.env.NODE_ENV === 'production' ? 'main-thread' : 'worker'
}

const createExecutionState = () => {
  if (typeof window === 'undefined') {
    return 'main-thread'
  }

  const runtime = getGenerationRuntime()
  if (runtime === 'worker' && typeof Worker !== 'undefined') {
    return 'initializing'
  }

  return 'main-thread'
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

const getGenerationErrorMessage = (generated) => {
  if (!generated) return null
  if (typeof generated.generationError === 'string' && generated.generationError.trim()) {
    return generated.generationError.trim()
  }
  if (generated.validation?.valid === false && Array.isArray(generated.validation.errors) && generated.validation.errors.length > 0) {
    return generated.validation.errors[0].message ?? 'Specimen generation failed.'
  }
  return null
}

export const useViewportViewModel = (specimen, revision) => {
  const generationInput = useMemo(
    () => cloneSpecimenInput(specimen, revision),
    [specimen, revision],
  )
  const deferredInput = useDeferredValue(generationInput)
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const [executionState, setExecutionState] = useState(createExecutionState)
  const [state, setState] = useState({
    generated: null,
    pending: true,
    error: null,
    revision: 0,
  })

  useEffect(() => {
    if (createExecutionState() !== 'initializing') {
      setExecutionState('main-thread')
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

        const nextGenerated = generated ? deserializeGeneratedPayload(generated) : null
        const nextError = getGenerationErrorMessage(nextGenerated)
        setState((current) => ({
          ...current,
          generated: nextError ? current.generated : nextGenerated,
          pending: false,
          error: nextError,
          revision: revision ?? current.revision,
        }))
      }
      worker.onerror = () => {
        worker.terminate()
        workerRef.current = null
        setExecutionState('main-thread')
        setState((current) => ({
          ...current,
          pending: false,
          error: current.error ?? 'Generation worker failed. Falling back to main-thread generation.',
        }))
      }
      setExecutionState('worker')
    } catch {
      setExecutionState('main-thread')
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

    if (executionState === 'worker' && workerRef.current) {
      const timeoutId = window.setTimeout(() => {
        if (requestId !== requestIdRef.current) return
        workerRef.current?.terminate()
        workerRef.current = null
        setExecutionState('main-thread')
        setState((current) => ({
          ...current,
          pending: false,
          error: current.error ?? 'Generation worker timed out. Falling back to main-thread generation.',
        }))
      }, 8000)

      workerRef.current.postMessage({ requestId, specimen: deferredInput })
      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      try {
        const generated = generateSpecimen(deferredInput)
        if (cancelled || requestId !== requestIdRef.current) return
        const nextGenerated = generated ? deserializeGeneratedPayload(serializeGeneratedPayload(generated)) : null
        const nextError = getGenerationErrorMessage(generated)
        setState((current) => ({
          ...current,
          generated: nextError ? current.generated : nextGenerated,
          pending: false,
          error: nextError,
          revision: deferredInput.revision ?? current.revision,
        }))
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
  }, [deferredInput, executionState])

  return state
}
