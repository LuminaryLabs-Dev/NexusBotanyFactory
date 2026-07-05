import { createRoot } from 'react-dom/client'
import EditorScreen, { AppShellFallback } from './views/editor/EditorScreen.jsx'
import AppErrorBoundary from './views/editor/AppErrorBoundary.jsx'
import './styles/globals.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container "#root" was not found.')
}

createRoot(container).render(
  <AppErrorBoundary resetKey="editor-root" renderFallback={AppShellFallback}>
    <EditorScreen />
  </AppErrorBoundary>,
)
