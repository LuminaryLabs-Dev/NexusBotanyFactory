'use client'

export default function PacksWorkspace({
  assets,
  draftPack,
  validation,
  loading,
  packs,
  status,
  error,
  selectedAssets,
  selectedAssetSummaries,
  setDraftName,
  addAsset,
  removeAsset,
  loadPack,
  resetDraft,
  saveDraft,
  deletePack,
  exportDraft,
}) {
  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      <div className="glass-panel-strong rounded-[1.35rem] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-secondary)]">Pack Builder</div>
            <div className="pt-2 text-[10px] font-medium leading-5 text-[color:var(--text-muted)]">
              Assemble exactly 10 saved trees, validate the pack, and export a companion packager spec.
            </div>
          </div>
          <div className="rounded-[0.95rem] border border-white/35 bg-white/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
            {validation.ready ? 'Ready to Export' : `${draftPack.treeAssetIds.length}/10 Trees`}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <input
            value={draftPack.name}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Pack name"
            className="flex-1 rounded-[1rem] border border-white/35 bg-white/25 px-4 py-3 text-[11px] font-semibold text-[color:var(--text-primary)] outline-none"
          />
          <button onClick={saveDraft} className="glass-button rounded-[1rem] px-4 py-3 text-[9px] font-black uppercase tracking-[0.22em]">Save Pack</button>
          <button onClick={exportDraft} className="glass-button active rounded-[1rem] px-4 py-3 text-[9px] font-black uppercase tracking-[0.22em]">Export Spec</button>
          <button onClick={resetDraft} className="glass-button rounded-[1rem] px-4 py-3 text-[9px] font-black uppercase tracking-[0.22em]">New</button>
        </div>
        <div className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
          Status: <span className="text-[color:var(--text-primary)]">{error ? `Error: ${error}` : status}</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <section className="glass-panel rounded-[1.35rem] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--accent-moss)]">Saved Trees</div>
          <div className="pt-2 text-[10px] leading-5 text-[color:var(--text-muted)]">Use saved specimens as pack members. Build remains the only 3D preview surface.</div>
          {assets.length === 0 ? (
            <div className="pt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Save specimens in Library before building a pack.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {assets.map((asset) => {
                const inPack = draftPack.treeAssetIds.includes(asset.id)
                return (
                  <div key={asset.id} className="rounded-[1rem] border border-white/30 bg-white/18 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-primary)]">{asset.name}</div>
                        <div className="pt-1 text-[8px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{asset.kind} {asset.presetId ? `· ${asset.presetId.split(':').at(-1)}` : ''}</div>
                      </div>
                      <button
                        onClick={() => addAsset(asset.id)}
                        disabled={inPack || draftPack.treeAssetIds.length >= 10}
                        className={`glass-button rounded-[0.85rem] px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] ${inPack ? 'opacity-50' : ''}`}
                      >
                        {inPack ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="glass-panel rounded-[1.35rem] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--accent-moss)]">Pack Contents</div>
          <div className="pt-2 text-[10px] leading-5 text-[color:var(--text-muted)]">
            Exactly 10 trees are required for a v1 pack. Validation issues stay visible until the pack is complete.
          </div>
          <div className="mt-4 space-y-2">
            {selectedAssets.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-white/35 px-4 py-6 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                No trees selected
              </div>
            ) : (
              selectedAssetSummaries.map(({ asset, lods }, index) => (
                <div key={asset.id} className="flex items-center justify-between rounded-[0.95rem] border border-white/28 bg-white/16 px-3 py-3">
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--text-primary)]">{index + 1}. {asset.name}</div>
                    <div className="pt-1 text-[8px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{asset.kind}</div>
                    <div className="pt-2 flex flex-wrap gap-1">
                      {lods.map((lod) => (
                        <span key={lod.level} className="rounded-[999px] border border-white/25 bg-white/18 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                          {lod.label} · {lod.representationType}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeAsset(asset.id)} className="glass-button rounded-[0.8rem] px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em]">Remove</button>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-[1rem] border border-white/25 bg-white/16 px-4 py-4">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Validation</div>
            {validation.issues.length === 0 ? (
              <div className="pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--accent-moss)]">Pack is valid</div>
            ) : (
              <div className="pt-2 space-y-1">
                {validation.issues.map((issue) => (
                  <div key={issue} className="text-[10px] leading-5 text-[color:var(--text-secondary)]">{issue}</div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[1.35rem] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--accent-moss)]">Saved Packs</div>
            <div className="pt-2 text-[10px] leading-5 text-[color:var(--text-muted)]">Reload existing pack definitions or delete drafts you no longer need.</div>
          </div>
          {loading ? <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Loading…</div> : null}
        </div>
        <div className="mt-4 space-y-3">
          {packs.length === 0 ? (
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">No saved packs yet.</div>
          ) : (
            packs.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/28 bg-white/16 px-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-primary)]">{pack.name}</div>
                  <div className="pt-1 text-[8px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{pack.treeAssetIds.length}/10 trees · {pack.status}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadPack(pack.id)} className="glass-button rounded-[0.8rem] px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em]">Load</button>
                  <button onClick={() => deletePack(pack.id)} className="glass-button rounded-[0.8rem] px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em]">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
