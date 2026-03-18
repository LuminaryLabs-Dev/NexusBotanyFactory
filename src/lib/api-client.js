import { browserProvider } from './providers/browserProvider.js'
import { restProvider } from './providers/restProvider.js'

const resolveProviderMode = () => {
  const mode = process.env.NEXT_PUBLIC_API_PROVIDER?.trim().toLowerCase()
  return mode === 'rest' ? 'rest' : 'browser'
}

const provider = resolveProviderMode() === 'rest' ? restProvider : browserProvider

export const apiClient = {
  ...provider,
  mode: resolveProviderMode(),
}
