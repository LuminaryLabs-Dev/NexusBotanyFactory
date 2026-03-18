'use client'

export default function LibraryPanel({ assets, loading, onLoadAsset, onSaveAsset, specimen }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#090909]/40 min-h-0">
      <button onClick={onSaveAsset} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
        Save Specimen
      </button>
      <div className="text-[9px] uppercase tracking-widest text-gray-500">Current: {specimen.name}</div>
      {loading ? (
        <p className="text-center text-[10px] font-black tracking-widest text-gray-600 mt-10">Loading library...</p>
      ) : assets.length === 0 ? (
        <p className="text-center text-[10px] font-black tracking-widest text-gray-600 mt-10">Empty Library.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-black/40 border border-white/10 p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black text-emerald-400 truncate">{asset.name}</h3>
              </div>
              <button onClick={() => onLoadAsset(asset.id)} className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
