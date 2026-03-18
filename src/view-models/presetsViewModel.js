import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client.js'

export const usePresetsViewModel = () => {
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.listPresets()
      .then((payload) => {
        if (!cancelled) setPresets(payload.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { presets, loading }
}
