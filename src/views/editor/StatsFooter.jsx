'use client'

export default function StatsFooter({ boneCount, status, error }) {
  return (
    <div className="flex items-center justify-between border-t border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(210,228,214,0.08))] px-4 py-4 text-[8px] font-black uppercase tracking-[0.26em] text-[color:var(--text-muted)]">
      <span className="max-w-[70%] truncate">{error ? `Error: ${error}` : `Status: ${status}`}</span>
      <span className="tabular-nums">Bones: {boneCount}</span>
    </div>
  )
}
