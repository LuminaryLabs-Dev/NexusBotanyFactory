'use client'

function Slider({ label, value, min, max, step = 0.1, suffix = '', onChange }) {
  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-center text-[9px] text-[color:var(--text-muted)] font-black uppercase tracking-[0.22em]">
        <label className="truncate pr-2">{label}</label>
        <span className="font-mono shrink-0 text-[color:var(--accent-moss)]">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(132,176,143,0.34),rgba(255,255,255,0.8),rgba(132,176,143,0.34))] accent-[color:var(--accent-moss)]"
      />
    </div>
  )
}

export default function LevelControls({ params, activeCategories, toggleCategory, updateLevel, getLevelSummary }) {
  return Array.from({ length: params.recursion + 1 }).map((_, depth) => (
    <div key={`lvl-${depth}`} className="glass-panel rounded-[1.25rem] px-4 py-3">
      <button onClick={() => toggleCategory(`lvl-${depth}`)} className="flex w-full items-center justify-between py-2.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        <div className="text-left">
          <span className="block text-[10px] font-black uppercase tracking-[0.24em]">{depth === 0 ? 'Primary Branches' : `Branch Layer ${depth + 1}`}</span>
          {!activeCategories.includes(`lvl-${depth}`) && (
            <span className="block pt-1 text-[9px] font-medium tracking-[0.08em] text-[color:var(--text-muted)]">
              {getLevelSummary(depth)}
            </span>
          )}
        </div>
        <span>{activeCategories.includes(`lvl-${depth}`) ? '−' : '+'}</span>
      </button>
      {activeCategories.includes(`lvl-${depth}`) && (
        <div className="pt-1 pb-1 space-y-3">
          <Slider label="Resolution" value={params.levels[depth]?.segments ?? 8} min={3} max={32} step={1} onChange={(value) => updateLevel(depth, 'segments', value)} />
          <Slider label="Curvature" value={params.levels[depth]?.curve ?? 0.5} min={0} max={2} onChange={(value) => updateLevel(depth, 'curve', value)} />
          <Slider label="Split Blending" value={params.levels[depth]?.splitSmoothness ?? 1} min={0} max={1} step={0.05} onChange={(value) => updateLevel(depth, 'splitSmoothness', value)} />
          {depth < params.recursion && (
            <>
              <Slider label="Side Branch Count" value={params.levels[depth]?.branchCount ?? 3} min={0} max={20} step={1} onChange={(value) => updateLevel(depth, 'branchCount', value)} />
              <Slider label="Branch Angle" value={params.levels[depth]?.branchAngle ?? 1} min={0.1} max={3} onChange={(value) => updateLevel(depth, 'branchAngle', value)} />
              <Slider label="Branch Length" value={params.levels[depth]?.lengthScale ?? 0.75} min={0.1} max={1.5} onChange={(value) => updateLevel(depth, 'lengthScale', value)} />
              <Slider label="Branch Thickness Falloff" value={params.levels[depth]?.radiusScale ?? 0.7} min={0.1} max={1} onChange={(value) => updateLevel(depth, 'radiusScale', value)} />
            </>
          )}
        </div>
      )}
    </div>
  ))
}
