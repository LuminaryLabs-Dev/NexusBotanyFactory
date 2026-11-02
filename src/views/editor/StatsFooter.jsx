'use client'

export default function StatsFooter({ boneCount, status, error, generationPending, generationError, previewLodLevel=0, simulation=null }) {
  const message = error ? `Edit error: ${error}` : generationError ? `Generation error: ${generationError}` : generationPending ? 'Updating tree…' : 'Tree preview ready'
  const statusColor = error || generationError ? 'text-red-800' : 'text-[#2a5a34]'
  return <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 border-t border-[#c5ddc7] bg-white/70 px-4 py-3 text-xs">
    <span className={statusColor}>{message}</span>
    <span className="shrink-0 text-[#315640] tabular-nums">{simulation ? `Growth ${simulation.currentYear}/${simulation.years} years` : `LOD ${previewLodLevel} · ${boneCount} axes`}</span>
  </div>
}
