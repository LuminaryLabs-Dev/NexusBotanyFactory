'use client'

export default function LibraryPanel({ assets, loading, onLoadAsset, onSaveAsset, specimen }) {
  const formatKindLabel = (asset) => {
    if (typeof asset.kind === 'string' && asset.kind.trim()) {
      return asset.kind
    }

    if (typeof asset.presetId === 'string' && asset.presetId.includes(':')) {
      return asset.presetId.split(':').at(-1)
    }

    return 'specimen'
  }

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      <div className="glass-panel-strong rounded-[1.35rem] px-4 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-secondary)]">Specimen Library</div>
        <div className="pt-1 text-[10px] font-medium leading-5 text-[color:var(--text-muted)]">Save the current study, then load any saved specimen back into Build.</div>
        <div className="pt-4">
          <button onClick={onSaveAsset} className="glass-button active w-full rounded-[1.1rem] py-3 text-[10px] font-black uppercase tracking-[0.24em]">
            Save Specimen
          </button>
        </div>
      </div>
      <div className="rounded-[1rem] border border-white/40 bg-white/20 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
        Current: <span className="text-[color:var(--text-primary)]">{specimen.name}</span>
      </div>
      {loading ? (
        <p className="mt-10 text-center text-[10px] font-black tracking-[0.24em] text-[color:var(--text-muted)]">Loading library...</p>
      ) : assets.length === 0 ? (
        <p className="mt-10 text-center text-[10px] font-black tracking-[0.24em] text-[color:var(--text-muted)]">Empty Library.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {assets.map((asset) => (
            <div key={asset.id} className="glass-panel rounded-[1.25rem] p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--accent-moss)]">{asset.name}</h3>
                  <div className="pt-1 text-[8px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                    {formatKindLabel(asset)}{asset.presetId ? ` · ${asset.presetId.split(':').at(-1)}` : ''}
                  </div>
                </div>
              </div>
              <button onClick={() => onLoadAsset(asset.id)} className="glass-button w-full rounded-[0.9rem] py-2 text-[9px] font-black uppercase tracking-[0.22em]">
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
