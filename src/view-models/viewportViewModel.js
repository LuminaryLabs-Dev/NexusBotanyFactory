import { useMemo } from 'react'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'

export const useViewportViewModel = (specimen) => useMemo(() => generateSpecimen(specimen), [specimen])
