'use client'

import PresetPicker from './PresetPicker.jsx'
import LevelControls from './LevelControls.jsx'

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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(132,176,143,0.34),rgba(255,255,255,0.82),rgba(132,176,143,0.34))] accent-[color:var(--accent-moss)]"
      />
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="space-y-1 w-full flex justify-between items-center">
      <label className="truncate pr-2 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{label}</label>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-6 w-6 cursor-pointer rounded-full border border-white/60 bg-transparent p-0 shadow-[0_6px_14px_rgba(82,112,88,0.16)]" />
    </div>
  )
}

export default function InspectorPanel({
  specimen,
  activeCategories,
  toggleCategory,
  applyPreset,
  updateParam,
  updateLevel,
}) {
  const { params } = specimen
  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-0 min-h-0 text-[color:var(--text-secondary)]">
      <div className="mb-4 text-[9px] font-black uppercase tracking-[0.28em] text-[color:var(--text-muted)]">Base Phenotype</div>
      <PresetPicker activePresetName={params.name} onApplyPreset={applyPreset} />
      <div className="border-t border-white/25 py-2">
        <button onClick={() => toggleCategory('cam')} className="flex w-full items-center justify-between py-2.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Orbit Cam</span>
          <span>{activeCategories.includes('cam') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('cam') && (
          <div className="pt-2 pb-4 space-y-3">
            <Slider label="Angle (Yaw)" value={params.camYaw ?? 45} min={-360} max={360} step={1} onChange={(value) => updateParam('camYaw', value)} />
            <Slider label="Pitch" value={params.camPitch ?? 15} min={-89} max={89} step={1} onChange={(value) => updateParam('camPitch', value)} />
            <Slider label="Distance" value={params.camDist ?? 100} min={10} max={400} step={1} onChange={(value) => updateParam('camDist', value)} />
          </div>
        )}
      </div>
      <div className="border-t border-white/25 py-2">
        <button onClick={() => toggleCategory('global')} className="flex w-full items-center justify-between py-2.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Base Structure</span>
          <span>{activeCategories.includes('global') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('global') && (
          <div className="pt-2 pb-4 space-y-3">
            <Slider label="Iterative Depth" value={params.recursion} min={1} max={5} step={1} onChange={(value) => updateParam('recursion', value)} />
            <Slider label="Vertical Height" value={params.height} min={2} max={80} suffix="m" onChange={(value) => updateParam('height', value)} />
            <Slider label="Base Thickness" value={params.radius} min={0.1} max={5} onChange={(value) => updateParam('radius', value)} />
            <Slider label="Trunk Taper" value={params.taper} min={0.01} max={1} onChange={(value) => updateParam('taper', value)} />
          </div>
        )}
      </div>
      <LevelControls params={params} activeCategories={activeCategories} toggleCategory={toggleCategory} updateLevel={updateLevel} />
      <div className="border-t border-white/25 py-2">
        <button onClick={() => toggleCategory('bark')} className="flex w-full items-center justify-between py-2.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Bark Material</span>
          <span>{activeCategories.includes('bark') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('bark') && (
          <div className="pt-2 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker label="Base Color" value={params.barkColor} onChange={(value) => updateParam('barkColor', value)} />
              <ColorPicker label="Branch Tint" value={params.barkTint} onChange={(value) => updateParam('barkTint', value)} />
            </div>
            <Slider label="Fiber" value={params.fiberIntensity} min={0} max={1} onChange={(value) => updateParam('fiberIntensity', value)} />
            <Slider label="Cracks" value={params.crackDepth} min={0} max={1} onChange={(value) => updateParam('crackDepth', value)} />
            <Slider label="Moss" value={params.mossAmount} min={0} max={1} onChange={(value) => updateParam('mossAmount', value)} />
          </div>
        )}
      </div>
      <div className="border-t border-white/25 py-2">
        <button onClick={() => toggleCategory('foliage')} className="flex w-full items-center justify-between py-2.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Foliage Shell</span>
          <span>{activeCategories.includes('foliage') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('foliage') && (
          <div className="pt-2 pb-4 space-y-3">
            <ColorPicker label="Leaf Color" value={params.leafColor} onChange={(value) => updateParam('leafColor', value)} />
            <Slider label="Foliage Coverage" value={params.leafCount} min={0} max={20000} step={100} onChange={(value) => updateParam('leafCount', value)} />
            <Slider label="Leaf Scale" value={params.leafSize} min={0.05} max={1.5} onChange={(value) => updateParam('leafSize', value)} />
          </div>
        )}
      </div>
    </div>
  )
}
