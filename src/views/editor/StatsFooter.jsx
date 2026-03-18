'use client'

export default function StatsFooter({ boneCount, status, error }) {
  return (
    <div className="p-4 shrink-0 border-t border-white/10 bg-black/20 text-[8px] font-black uppercase tracking-widest text-gray-600 flex justify-between items-center">
      <span>{error ? `Error: ${error}` : `Status: ${status}`}</span>
      <span className="tabular-nums">Bones: {boneCount}</span>
    </div>
  )
}
