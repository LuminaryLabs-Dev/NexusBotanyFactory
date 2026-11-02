'use client'

export default function PresetPicker({ presets = [], activePresetKey, onApplyPreset }) {
  return <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose tree species">
    {presets.map(preset => {
      const selected = activePresetKey === preset.id || activePresetKey === preset.name
      return <button type="button" key={preset.id} onClick={() => onApplyPreset(preset)} aria-pressed={selected}
        className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${selected?'border-[#285a39] bg-[#315c3b] text-white':'border-[rgba(22,66,29,.3)] bg-white/70 text-[#1d4531] hover:bg-white'}`}>
        {preset.name}
      </button>
    })}
  </div>
}
