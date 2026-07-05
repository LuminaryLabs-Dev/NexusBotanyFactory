'use client'

import { useEffect, useRef } from 'react'
import { Trees } from 'lucide-react'
import { useEditorViewModel } from '../../view-models/editorViewModel.js'
import InspectorPanel from './InspectorPanel.jsx'
import StatsFooter from './StatsFooter.jsx'
import BotanyViewport from '../viewport/BotanyViewport.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'
import { attachAppRpcRegistry } from '../../lib/browser/appRpc.js'

const VIEW_MODE_OPTIONS = [
  { id: 'beauty', label: 'Beauty' },
  { id: 'structure', label: 'Structure' },
  { id: 'bones', label: 'Bones' },
  { id: 'leaf-density', label: 'Leaf Density' },
]

const PLAYBACK_SPEEDS = [1, 4, 12, 24]

const TOOLBAR_PANEL_CLASS = 'glass-panel-strong shrink-0 rounded-[1.35rem] border border-[rgba(22,66,29,0.58)] px-4 py-3'
const TOOLBAR_GROUP_CLASS = 'flex flex-wrap items-center gap-2'
const TOOLBAR_BUTTON_BASE = 'rounded-[0.95rem] border border-[rgba(22,66,29,0.6)] bg-[linear-gradient(180deg,rgba(247,255,243,0.92),rgba(211,237,203,0.7))] px-4 py-[0.72rem] text-[9px] font-black uppercase tracking-[0.22em] text-[#173319] shadow-[inset_1px_1px_0_rgba(255,255,255,0.54),inset_-1px_-1px_0_rgba(21,56,27,0.12),0_10px_20px_rgba(20,52,25,0.12)] transition-all hover:bg-[linear-gradient(180deg,rgba(252,255,249,0.98),rgba(224,244,218,0.82))] disabled:cursor-not-allowed disabled:opacity-50'
const TOOLBAR_BUTTON_ACTIVE = 'border-[rgba(22,66,29,0.82)] bg-[linear-gradient(180deg,rgba(222,247,214,0.98),rgba(132,191,122,0.72))] text-[#122c14] shadow-[inset_1px_1px_0_rgba(255,255,255,0.6),inset_-1px_-1px_0_rgba(20,52,25,0.18),0_14px_28px_rgba(54,108,62,0.24)]'

const formatProgress = (playback) => {
  if (!playback) return 'Year 1 · Tick 0'
  return `Year ${playback.currentYear}/${playback.years} · Tick ${playback.currentTickInYear}/${playback.ticksPerYear}`
}

const ViewportToolbar = ({ editor }) => (
  <div className={`${TOOLBAR_PANEL_CLASS} flex items-center justify-between gap-3`}>
    <div className={`${TOOLBAR_GROUP_CLASS} min-w-0 flex-1`}>
      <button onClick={editor.requestFrame} className={TOOLBAR_BUTTON_BASE}>Frame</button>
      {VIEW_MODE_OPTIONS.map((mode) => (
        <button
          key={mode.id}
          onClick={() => editor.setDebugMode(mode.id)}
          className={`${TOOLBAR_BUTTON_BASE} ${editor.debugMode === mode.id ? TOOLBAR_BUTTON_ACTIVE : ''}`}
        >
          {mode.label}
        </button>
      ))}
    </div>
    <div className={`${TOOLBAR_GROUP_CLASS} shrink-0`}>
      {[0, 1, 2, 3].map((level) => (
        <button
          key={level}
          onClick={() => editor.setPreviewLodLevel(level)}
          className={`${TOOLBAR_BUTTON_BASE} ${editor.previewLodLevel === level ? TOOLBAR_BUTTON_ACTIVE : ''}`}
        >
          {`LOD${level}`}
        </button>
      ))}
    </div>
  </div>
)

const PlaybackToolbar = ({ editor }) => {
  const playback = editor.playback
  const scrubValue = playback?.absoluteTick ?? 0
  const scrubMax = Math.max(playback?.totalTicks ?? 0, 1)

  return (
    <div className={`${TOOLBAR_PANEL_CLASS} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={TOOLBAR_GROUP_CLASS}>
          <button
            onClick={playback?.playing ? editor.pauseSimulation : editor.playSimulation}
            disabled={editor.generationPending || !editor.generated}
            className={`${TOOLBAR_BUTTON_BASE} ${playback?.playing ? TOOLBAR_BUTTON_ACTIVE : ''}`}
          >
            {playback?.playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={editor.resetSimulation} disabled={editor.generationPending || !editor.generated} className={TOOLBAR_BUTTON_BASE}>Reset</button>
          <button onClick={editor.stepSimulation} disabled={editor.generationPending || !editor.generated} className={TOOLBAR_BUTTON_BASE}>Step</button>
        </div>
        <div className={TOOLBAR_GROUP_CLASS}>
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => editor.setPlaybackSpeed(speed)}
              className={`${TOOLBAR_BUTTON_BASE} ${playback?.speed === speed ? TOOLBAR_BUTTON_ACTIVE : ''}`}
            >
              {`${speed}x`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.22em] text-[#173319]">
          <span>{formatProgress(playback)}</span>
          <span className="tabular-nums">{`${scrubValue}/${scrubMax}`}</span>
        </div>
        <input
          type="range"
          min={0}
          max={scrubMax}
          step={1}
          value={Math.min(scrubValue, scrubMax)}
          onChange={(event) => editor.seekSimulationTick(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(235,251,228,0.92),rgba(22,84,33,0.78),rgba(235,251,228,0.92))]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          <span>{`Years ${playback?.years ?? 20}`}</span>
          <span>{`Ticks / Year ${playback?.ticksPerYear ?? 12}`}</span>
        </div>
      </div>
    </div>
  )
}

const ViewportStatusCard = ({ editor }) => {
  const message = editor.generationError
    ? `Simulation error: ${editor.generationError}`
    : editor.generationPending
      ? 'Simulation is loading.'
      : null

  if (!message) return null

  return (
    <div className="shrink-0 border-b border-[rgba(22,66,29,0.22)] px-4 py-3">
      <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
        {message}
      </div>
    </div>
  )
}

const ViewportFallback = ({ error, reset }) => (
  <div className="flex h-full items-center justify-center p-6">
    <div className="glass-panel-strong max-w-xl rounded-[1.8rem] px-6 py-6 text-[color:var(--text-secondary)] shadow-[0_30px_80px_rgba(34,65,43,0.18)]">
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
        Viewport Error
      </div>
      <h3 className="pt-2 text-lg font-black uppercase tracking-[0.16em] text-[color:var(--text-primary)]">
        The 3D stage failed, but the editor shell is still running
      </h3>
      <p className="pt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {error?.message ?? 'The viewport subtree threw during render.'}
      </p>
      <div className="pt-4">
        <button onClick={reset} className={TOOLBAR_BUTTON_BASE}>
          Retry Viewport
        </button>
      </div>
    </div>
  </div>
)

const AppShellFallback = ({ error, reset }) => (
  <div className="greenhouse-shell flex h-screen w-full select-none flex-col overflow-hidden text-[color:var(--text-primary)]">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,244,219,0.9),rgba(210,244,219,0)_68%)] blur-3xl" />
      <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(168,221,183,0.55),rgba(168,221,183,0)_72%)] blur-3xl" />
    </div>
    <header className="glass-panel-strong relative z-30 mx-3 mt-3 shrink-0 rounded-[1.3rem] border border-[rgba(22,66,29,0.58)] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-[rgba(22,66,29,0.42)] bg-[linear-gradient(180deg,rgba(246,255,243,0.68),rgba(191,229,187,0.26))] shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
          <Trees size={20} className="text-[#173719]" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-black uppercase tracking-[0.24em] text-[color:var(--text-primary)]">NexusBotanyFactory</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Shell Recovered From Render Failure</p>
        </div>
      </div>
    </header>
    <div className="relative flex flex-1 overflow-hidden px-4 pb-4 pt-3">
      <main className="glass-panel-strong relative mr-4 flex flex-1 min-h-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/60 p-6">
        <div className="glass-panel-strong max-w-2xl rounded-[1.8rem] px-6 py-6 text-[color:var(--text-secondary)]">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--text-muted)]">App Error</div>
          <h3 className="pt-2 text-lg font-black uppercase tracking-[0.16em] text-[color:var(--text-primary)]">
            The editor tree failed before the full UI could mount
          </h3>
          <p className="pt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            {error?.message ?? 'Unknown render error.'}
          </p>
          <div className="pt-4">
            <button onClick={reset} className={TOOLBAR_BUTTON_BASE}>Retry App</button>
          </div>
        </div>
      </main>
      <aside className="glass-panel relative flex w-[360px] flex-col overflow-hidden rounded-[2rem] border border-white/60 p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-secondary)]">Inspector</div>
        <div className="pt-2 text-[10px] leading-5 text-[color:var(--text-muted)]">
          The live editor failed before specimen state was available. The shell stays visible so the failure is explicit instead of collapsing to the page background.
        </div>
      </aside>
    </div>
  </div>
)

export default function EditorScreen() {
  const editor = useEditorViewModel()
  const editorRef = useRef(editor)

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => attachAppRpcRegistry(editorRef), [])

  const saveAsset = async () => {
    await editor.saveAsset()
  }

  return (
    <div className="greenhouse-shell flex h-screen w-full select-none flex-col overflow-hidden text-[color:var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,244,219,0.9),rgba(210,244,219,0)_68%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(168,221,183,0.55),rgba(168,221,183,0)_72%)] blur-3xl" />
      </div>

      <header className="glass-panel-strong relative z-30 mx-3 mt-3 shrink-0 rounded-[1.3rem] border border-[rgba(22,66,29,0.58)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-[rgba(22,66,29,0.42)] bg-[linear-gradient(180deg,rgba(246,255,243,0.68),rgba(191,229,187,0.26))] shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
              <Trees size={20} className="text-[#173719]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black uppercase tracking-[0.24em] text-[color:var(--text-primary)]">NexusBotanyFactory</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Pine Growth Simulation</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={editor.randomizeSeed} className="rounded-[0.95rem] border border-[rgba(22,66,29,0.42)] bg-[linear-gradient(180deg,rgba(248,255,245,0.72),rgba(206,236,199,0.3))] px-4 py-[0.55rem] text-[9px] font-black uppercase tracking-[0.24em] text-[#173319] shadow-[inset_1px_1px_0_rgba(255,255,255,0.46),inset_-1px_-1px_0_rgba(25,63,30,0.1)]">Randomize</button>
            <button
              onClick={() => void editor.exportFbx()}
              disabled={editor.generationPending || !editor.generated?.treeData}
              className="rounded-[0.95rem] border border-[rgba(22,66,29,0.42)] bg-[linear-gradient(180deg,rgba(248,255,245,0.72),rgba(206,236,199,0.3))] px-4 py-[0.55rem] text-[9px] font-black uppercase tracking-[0.24em] text-[#173319] shadow-[inset_1px_1px_0_rgba(255,255,255,0.46),inset_-1px_-1px_0_rgba(25,63,30,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export FBX
            </button>
            <button onClick={saveAsset} className="rounded-[0.95rem] border border-[rgba(22,66,29,0.42)] bg-[linear-gradient(180deg,rgba(224,251,217,0.94),rgba(133,198,126,0.52))] px-4 py-[0.55rem] text-[9px] font-black uppercase tracking-[0.24em] text-[#132b15] shadow-[inset_1px_1px_0_rgba(255,255,255,0.5),inset_-1px_-1px_0_rgba(25,63,30,0.14)]">Save</button>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-3">
        <section className="mr-4 flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <ViewportToolbar editor={editor} />
          <main className="glass-panel-strong relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/60">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_34%),linear-gradient(180deg,rgba(249,255,250,0.12),rgba(255,255,255,0)_28%)]" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <ViewportStatusCard editor={editor} />
              <div className="min-h-0 flex-1">
                <AppErrorBoundary
                  resetKey={`${editor.specimenRevision}:${editor.generationRevision}:${editor.previewLodLevel}:${editor.debugMode}`}
                  renderFallback={({ error, reset }) => <ViewportFallback error={error} reset={reset} />}
                >
                  <BotanyViewport
                    specimen={editor.specimen}
                    generated={editor.generated}
                    debugMode={editor.debugMode}
                    previewLodLevel={editor.previewLodLevel}
                    frameRequestToken={editor.frameRequestToken}
                    specimenRevision={editor.specimenRevision}
                    generationRevision={editor.generationRevision}
                  />
                </AppErrorBoundary>
              </div>
            </div>
          </main>
          <PlaybackToolbar editor={editor} />
        </section>

        <aside className="glass-panel relative flex w-[360px] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/60">
          <InspectorPanel
            specimen={editor.specimen}
            applyPreset={editor.applyPreset}
            updatePath={editor.updatePath}
            presets={editor.presets}
            customDefinition={null}
          />
          <StatsFooter
            boneCount={editor.boneCount}
            status={editor.status}
            error={editor.error}
            generationPending={editor.generationPending}
            generationError={editor.generationError}
            previewLodLevel={editor.previewLodLevel}
            simulation={editor.generated?.simulation ?? editor.playback ?? null}
          />
        </aside>
      </div>
    </div>
  )
}

export { AppShellFallback }
