'use client'

import PresetPicker from './PresetPicker.jsx'
import LevelControls from './LevelControls.jsx'

function Slider({ label, value, min, max, step = 0.1, suffix = '', onChange }) {
  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-widest">
        <label className="truncate pr-2">{label}</label>
        <span className="text-emerald-400 font-mono shrink-0">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="space-y-1 w-full flex justify-between items-center">
      <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest truncate pr-2">{label}</label>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent" />
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
    <div className="flex-1 overflow-y-auto p-4 space-y-0 custom-scrollbar bg-[#090909]/40 min-h-0">
      <div className="mb-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Base Phenotype</div>
      <PresetPicker activePresetName={params.name} onApplyPreset={applyPreset} />
      <div className="border-t border-white/5 py-1">
        <button onClick={() => toggleCategory('cam')} className="w-full flex items-center justify-between py-2.5 text-gray-400 hover:text-white">
          <span className="text-[10px] font-black uppercase tracking-widest">Orbit Cam</span>
          <span>{activeCategories.includes('cam') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('cam') && (
          <div className="pt-1 pb-4 space-y-3">
            <Slider label="Angle (Yaw)" value={params.camYaw ?? 45} min={-360} max={360} step={1} onChange={(value) => updateParam('camYaw', value)} />
            <Slider label="Pitch" value={params.camPitch ?? 15} min={-89} max={89} step={1} onChange={(value) => updateParam('camPitch', value)} />
            <Slider label="Distance" value={params.camDist ?? 100} min={10} max={400} step={1} onChange={(value) => updateParam('camDist', value)} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 py-1">
        <button onClick={() => toggleCategory('global')} className="w-full flex items-center justify-between py-2.5 text-gray-400 hover:text-white">
          <span className="text-[10px] font-black uppercase tracking-widest">Base Structure</span>
          <span>{activeCategories.includes('global') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('global') && (
          <div className="pt-1 pb-4 space-y-3">
            <Slider label="Iterative Depth" value={params.recursion} min={1} max={5} step={1} onChange={(value) => updateParam('recursion', value)} />
            <Slider label="Vertical Height" value={params.height} min={2} max={80} suffix="m" onChange={(value) => updateParam('height', value)} />
            <Slider label="Base Thickness" value={params.radius} min={0.1} max={5} onChange={(value) => updateParam('radius', value)} />
            <Slider label="Trunk Taper" value={params.taper} min={0.01} max={1} onChange={(value) => updateParam('taper', value)} />
          </div>
        )}
      </div>
      <LevelControls params={params} activeCategories={activeCategories} toggleCategory={toggleCategory} updateLevel={updateLevel} />
      <div className="border-t border-white/5 py-1">
        <button onClick={() => toggleCategory('bark')} className="w-full flex items-center justify-between py-2.5 text-gray-400 hover:text-white">
          <span className="text-[10px] font-black uppercase tracking-widest">Bark Material</span>
          <span>{activeCategories.includes('bark') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('bark') && (
          <div className="pt-1 pb-4 space-y-3">
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
      <div className="border-t border-white/5 py-1">
        <button onClick={() => toggleCategory('foliage')} className="w-full flex items-center justify-between py-2.5 text-gray-400 hover:text-white">
          <span className="text-[10px] font-black uppercase tracking-widest">Foliage Shell</span>
          <span>{activeCategories.includes('foliage') ? '−' : '+'}</span>
        </button>
        {activeCategories.includes('foliage') && (
          <div className="pt-1 pb-4 space-y-3">
            <ColorPicker label="Leaf Color" value={params.leafColor} onChange={(value) => updateParam('leafColor', value)} />
            <Slider label="Foliage Coverage" value={params.leafCount} min={0} max={20000} step={100} onChange={(value) => updateParam('leafCount', value)} />
            <Slider label="Leaf Scale" value={params.leafSize} min={0.05} max={1.5} onChange={(value) => updateParam('leafSize', value)} />
          </div>
        )}
      </div>
    </div>
  )
}
