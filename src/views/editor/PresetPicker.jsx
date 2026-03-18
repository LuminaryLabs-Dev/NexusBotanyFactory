'use client'

import { SPECIES_PRESETS } from '../../models/botany/schema/presets.js'

export default function PresetPicker({ activePresetName, onApplyPreset }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {Object.keys(SPECIES_PRESETS).map((name) => (
        <button
          key={name}
          onClick={() => onApplyPreset(name)}
          className={`glass-chip px-3 py-2 rounded-[0.95rem] text-[9px] font-black uppercase tracking-[0.22em] transition-all ${activePresetName === name ? 'active' : ''}`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
