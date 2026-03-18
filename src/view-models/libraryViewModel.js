import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client.js'

export const useLibraryViewModel = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    const payload = await apiClient.listAssets()
    setAssets(payload.items)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const payload = await apiClient.listAssets()
      if (cancelled) return
      setAssets(payload.items)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { assets, loading, reload }
}
