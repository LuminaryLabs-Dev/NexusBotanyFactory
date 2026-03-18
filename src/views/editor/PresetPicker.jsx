'use client'

import { SPECIES_PRESETS } from '../../models/botany/schema/presets.js'

export default function PresetPicker({ activePresetName, onApplyPreset }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {Object.keys(SPECIES_PRESETS).map((name) => (
        <button
          key={name}
          onClick={() => onApplyPreset(name)}
          className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all border ${activePresetName === name ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
