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
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white overflow-hidden select-none">
      <header className="h-14 shrink-0 bg-[#0c0c0c] border-b border-white/10 px-6 flex items-center justify-between z-30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg">
            <Trees size={20} className="text-black" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em]">NexusBotanyFactory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={editor.randomizeSeed} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Randomize</button>
          <button onClick={editor.saveAsset} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Save</button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative overflow-hidden bg-white">
          <BotanyViewport specimen={editor.specimen} generated={editor.generated} debugMode={editor.debugMode} />
          <div className="absolute top-6 right-6 flex bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-0.5 shadow-2xl">
            {['shaded', 'wireframe', 'skeleton'].map((mode) => (
              <button
                key={mode}
                onClick={() => editor.setDebugMode(mode)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${editor.debugMode === mode ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </main>
        <aside className="w-[340px] bg-[#0c0c0c] border-l border-white/10 flex flex-col z-20 shadow-2xl overflow-hidden">
          <div className="flex w-full bg-black/40 border-b border-white/5 shrink-0">
            <button onClick={() => editor.setActiveTab('inspector')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] ${editor.activeTab === 'inspector' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-gray-500 hover:text-white'}`}>Inspector</button>
            <button onClick={() => editor.setActiveTab('library')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] ${editor.activeTab === 'library' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-gray-500 hover:text-white'}`}>Library</button>
          </div>
          {editor.activeTab === 'inspector' ? (
            <InspectorPanel
              specimen={editor.specimen}
              activeCategories={editor.activeCategories}
              toggleCategory={editor.toggleCategory}
              applyPreset={editor.applyPreset}
              updateParam={editor.updateParam}
              updateLevel={editor.updateLevel}
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
