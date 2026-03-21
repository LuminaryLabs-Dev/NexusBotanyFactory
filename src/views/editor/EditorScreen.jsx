'use client'

import dynamic from 'next/dynamic'
import { Trees } from 'lucide-react'
import { useEditorViewModel } from '../../view-models/editorViewModel.js'
import { useLibraryViewModel } from '../../view-models/libraryViewModel.js'
import CustomSpecimenEditorPanel from './CustomSpecimenEditorPanel.jsx'
import InspectorPanel from './InspectorPanel.jsx'
import LibraryPanel from './LibraryPanel.jsx'
import RefineWorkspace from './RefineWorkspace.jsx'
import StatsFooter from './StatsFooter.jsx'

const BotanyViewport = dynamic(() => import('../viewport/BotanyViewport.jsx'), { ssr: false })

export default function EditorScreen() {
  const editor = useEditorViewModel()
  const library = useLibraryViewModel()
  const isBuildView = editor.activeTab === 'build'
  const saveAndRefreshLibrary = async () => {
    await editor.saveAsset()
    await library.reload()
  }

  const tabButtonClass = (tab) => `rounded-[1rem] border border-white/18 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#f1fff3] transition-all ${editor.activeTab === tab ? 'bg-[rgba(173,227,181,0.42)] text-[#f7fff8]' : ''}`

  return (
    <div className="greenhouse-shell flex flex-col h-screen w-full overflow-hidden select-none text-[color:var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,244,219,0.9),rgba(210,244,219,0)_68%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(168,221,183,0.55),rgba(168,221,183,0)_72%)] blur-3xl" />
      </div>
      <header className="relative mx-4 mt-4 shrink-0 rounded-[1.4rem] border border-white/20 bg-[#00540f] px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] z-30">
        <div className="flex flex-nowrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
              <Trees size={20} className="text-[#d5f4dd]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#cdebd2]">Greenhouse Lab</p>
              <h1 className="text-sm font-black uppercase tracking-[0.24em] text-[#f1fff3]">NexusBotanyFactory</h1>
            </div>
          </div>
          <div className="greenhouse-horizontal-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1">
            <button onClick={() => editor.setActiveTab('build')} className={tabButtonClass('build')}>Build</button>
            <button onClick={() => editor.setActiveTab('refine')} className={tabButtonClass('refine')}>Refine</button>
            <button onClick={() => editor.setActiveTab('editor')} className={tabButtonClass('editor')}>Editor</button>
            <button onClick={() => editor.setActiveTab('library')} className={tabButtonClass('library')}>Library</button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={editor.randomizeSeed} className="rounded-[1rem] border border-white/18 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#f1fff3] shadow-[inset_1px_1px_0_rgba(255,255,255,0.12)]">Randomize</button>
            <button onClick={saveAndRefreshLibrary} className="rounded-[1rem] border border-white/18 bg-[rgba(173,227,181,0.3)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#f1fff3] shadow-[inset_1px_1px_0_rgba(255,255,255,0.18)]">Save</button>
          </div>
        </div>
      </header>
      <div className="relative flex flex-1 overflow-hidden px-4 pb-4 pt-3">
        {isBuildView ? (
          <>
            <main className="glass-panel-strong relative flex-1 overflow-hidden rounded-[2rem] border border-white/60">
              <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_34%),linear-gradient(180deg,rgba(249,255,250,0.12),rgba(255,255,255,0)_28%)]" />
              <BotanyViewport
                specimen={editor.specimen}
                generated={editor.generated}
                debugMode={editor.debugMode}
                frameRequestToken={editor.frameRequestToken}
                specimenRevision={editor.specimenRevision}
                generationRevision={editor.generationRevision}
              />
              <div className="glass-panel absolute top-6 right-6 z-20 flex items-center gap-1 rounded-[1.2rem] p-1.5">
                {editor.generationPending ? (
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                    Updating
                  </div>
                ) : null}
                <button
                  onClick={editor.requestFrame}
                  className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em]"
                >
                  Frame
                </button>
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
              <InspectorPanel
                specimen={editor.specimen}
                applyPreset={editor.applyPreset}
                updatePath={editor.updatePath}
                presets={editor.presets}
                customDefinition={editor.activeCustomDefinition}
              />
              <StatsFooter
                boneCount={editor.boneCount}
                status={editor.status}
                error={editor.error}
                generationPending={editor.generationPending}
                generationError={editor.generationError}
              />
            </aside>
          </>
        ) : (
          <main className="glass-panel-strong relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/60">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,rgba(249,255,250,0.12),rgba(255,255,255,0)_28%)]" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              {editor.activeTab === 'refine' ? (
                <RefineWorkspace
                  specimen={editor.specimen}
                  activeCategories={editor.activeCategories}
                  toggleCategory={editor.toggleCategory}
                  updatePath={editor.updatePath}
                  getLevelSummary={editor.getLevelSummary}
                  customDefinition={editor.activeCustomDefinition}
                />
              ) : editor.activeTab === 'editor' ? (
                <CustomSpecimenEditorPanel
                  definitions={editor.customDefinitions}
                  draft={editor.customDraft}
                  selectedDefinitionId={editor.selectedCustomSpecimenId}
                  catalogStatus={editor.catalogStatus}
                  catalogError={editor.catalogError}
                  selectDefinition={editor.selectCustomDefinition}
                  createBlankDefinition={editor.createBlankDefinition}
                  cloneSelectedDefinition={editor.cloneSelectedDefinition}
                  saveDraft={editor.saveCustomDraft}
                  deleteSelectedDefinition={editor.deleteSelectedDefinition}
                  toggleDefinitionEnabled={editor.toggleDefinitionEnabled}
                  updateDraftPath={editor.updateDraftPath}
                  addField={editor.addField}
                  updateField={editor.updateField}
                  removeField={editor.removeField}
                  applyDraftToSpecimen={editor.applyDraftToSpecimen}
                  exportDefinitions={editor.exportDefinitions}
                  importDefinitions={editor.importDefinitions}
                />
              ) : (
                <LibraryPanel
                  assets={library.assets}
                  loading={library.loading}
                  onLoadAsset={editor.loadAsset}
                  onSaveAsset={saveAndRefreshLibrary}
                  specimen={editor.specimen}
                />
              )}
              <StatsFooter
                boneCount={editor.boneCount}
                status={editor.status}
                error={editor.error}
                generationPending={editor.generationPending}
                generationError={editor.generationError}
              />
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
