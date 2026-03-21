'use client'

import { useRef } from 'react'

export default function PresetPicker({ presets = [], activePresetKey, onApplyPreset }) {
  const rowRef = useRef(null)

  const handleWheel = (event) => {
    const row = rowRef.current
    if (!row) return

    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

    event.preventDefault()
    row.scrollLeft += event.deltaY
  }

  return (
    <div
      ref={rowRef}
      onWheel={handleWheel}
      className="greenhouse-horizontal-scrollbar mb-4 flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-2 pr-2 snap-x snap-mandatory"
    >
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onApplyPreset(preset)}
          className={`glass-chip snap-start shrink-0 px-4 py-3 rounded-[0.95rem] text-[9px] font-black uppercase tracking-[0.22em] transition-all ${activePresetKey === preset.id ? 'active' : ''}`}
        >
          <span className="block">{preset.name}</span>
          {preset.kind === 'custom' ? (
            <span className="mt-1 block text-[7px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
              {preset.source === 'builtin' ? 'Template' : 'Custom'}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
