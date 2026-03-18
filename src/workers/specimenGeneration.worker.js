import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { serializeGeneratedPayload } from '../models/botany/serialization/generatedPayload.js'

globalThis.onmessage = (event) => {
  const { requestId, specimen } = event.data ?? {}

  try {
    const generated = generateSpecimen(specimen)
    globalThis.postMessage({
      requestId,
      revision: specimen?.revision ?? 0,
      generated: serializeGeneratedPayload(generated),
    })
  } catch (error) {
    globalThis.postMessage({
      requestId,
      revision: specimen?.revision ?? 0,
      error: error instanceof Error ? error.message : 'Specimen generation failed.',
    })
  }
}
