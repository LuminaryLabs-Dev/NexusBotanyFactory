'use client'

import dynamic from 'next/dynamic'
import { Trees } from 'lucide-react'
import { useEditorViewModel } from '../../view-models/editorViewModel.js'
import { useLibraryViewModel } from '../../view-models/libraryViewModel.js'
import InspectorPanel from './InspectorPanel.jsx'
import LibraryPanel from './LibraryPanel.jsx'
import StatsFooter from './StatsFooter.jsx'

const BotanyViewport = dynamic(() => import('../viewport/BotanyViewport.jsx'), { ssr: false })

export default function EditorScreen() {
  const editor = useEditorViewModel()
  const library = useLibraryViewModel()

  return (
    <div className="greenhouse-shell flex flex-col h-screen w-full overflow-hidden select-none text-[color:var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,244,219,0.9),rgba(210,244,219,0)_68%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(168,221,183,0.55),rgba(168,221,183,0)_72%)] blur-3xl" />
      </div>
      <header className="glass-panel-strong relative mx-4 mt-4 h-16 shrink-0 rounded-[1.4rem] px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/70 bg-[linear-gradient(180deg,rgba(240,255,244,0.95),rgba(149,205,165,0.55))] shadow-[0_16px_34px_rgba(92,157,108,0.22)]">
            <Trees size={20} className="text-[color:var(--accent-moss)]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[color:var(--text-muted)]">Greenhouse Lab</p>
            <h1 className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--text-primary)]">NexusBotanyFactory</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={editor.randomizeSeed} className="glass-button rounded-[1rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em]">Randomize</button>
          <button onClick={editor.saveAsset} className="glass-button active rounded-[1rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em]">Save</button>
        </div>
      </header>
      <div className="relative flex flex-1 overflow-hidden px-4 pb-4 pt-3">
        <main className="glass-panel-strong relative flex-1 overflow-hidden rounded-[2rem] border border-white/60">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_34%),linear-gradient(180deg,rgba(249,255,250,0.12),rgba(255,255,255,0)_28%)]" />
          <BotanyViewport specimen={editor.specimen} generated={editor.generated} debugMode={editor.debugMode} />
          <div className="glass-panel absolute top-6 right-6 z-20 flex gap-1 rounded-[1.2rem] p-1.5">
            {['beauty', 'structure', 'bones', 'leaf-density'].map((mode) => (
              <button
                key={mode}
                onClick={() => editor.setDebugMode(mode)}
                className={`glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] transition-all ${editor.debugMode === mode ? 'active' : ''}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </main>
        <aside className="glass-panel relative ml-4 flex w-[360px] flex-col overflow-hidden rounded-[2rem] border border-white/60">
          <div className="flex w-full shrink-0 gap-2 border-b border-white/30 p-3">
            <button onClick={() => editor.setActiveTab('build')} className={`glass-button flex-1 rounded-[1rem] py-3 text-[10px] font-black uppercase tracking-[0.22em] ${editor.activeTab === 'build' ? 'active' : ''}`}>Build</button>
            <button onClick={() => editor.setActiveTab('refine')} className={`glass-button flex-1 rounded-[1rem] py-3 text-[10px] font-black uppercase tracking-[0.22em] ${editor.activeTab === 'refine' ? 'active' : ''}`}>Refine</button>
            <button onClick={() => editor.setActiveTab('library')} className={`glass-button flex-1 rounded-[1rem] py-3 text-[10px] font-black uppercase tracking-[0.22em] ${editor.activeTab === 'library' ? 'active' : ''}`}>Library</button>
          </div>
          {(editor.activeTab === 'build' || editor.activeTab === 'refine') ? (
            <InspectorPanel
              specimen={editor.specimen}
              activeCategories={editor.activeCategories}
              toggleCategory={editor.toggleCategory}
              applyPreset={editor.applyPreset}
              updateParam={editor.updateParam}
              updateLevel={editor.updateLevel}
              activeTab={editor.activeTab}
              getLevelSummary={editor.getLevelSummary}
            />
          ) : (
            <LibraryPanel
              assets={library.assets}
              loading={library.loading}
              onLoadAsset={editor.loadAsset}
              onSaveAsset={editor.saveAsset}
              specimen={editor.specimen}
            />
          )}
          <StatsFooter boneCount={editor.boneCount} status={editor.status} error={editor.error} />
        </aside>
      </div>
    </div>
  )
}
