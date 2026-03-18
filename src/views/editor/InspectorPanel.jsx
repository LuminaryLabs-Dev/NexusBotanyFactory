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

function SectionCard({ id, title, helper, children, emphasis = false, activeCategories, toggleCategory }) {
  return (
    <div className={`${emphasis ? 'glass-panel-strong' : 'glass-panel'} rounded-[1.35rem] px-4 py-4`}>
      <button onClick={() => toggleCategory(id)} className="flex w-full items-center justify-between text-left text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.26em]">{title}</div>
          <div className="pt-1 text-[10px] font-medium text-[color:var(--text-muted)]">{helper}</div>
        </div>
        <span className="pl-4 text-sm">{activeCategories.includes(id) ? '−' : '+'}</span>
      </button>
      {activeCategories.includes(id) && <div className="pt-4 space-y-3">{children}</div>}
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
  activeTab,
  getLevelSummary,
}) {
  const { params } = specimen
  const isBuild = activeTab === 'build'

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      {isBuild ? (
        <>
          <SectionCard id="phenotype" title="Phenotype" helper="Start with the species archetype and overall growth personality." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <PresetPicker activePresetName={params.name} onApplyPreset={applyPreset} />
          </SectionCard>
          <SectionCard id="form" title="Base Form" helper="Control the true trunk and whole-tree silhouette before branch tuning." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Branch Levels" value={params.recursion} min={1} max={5} step={1} onChange={(value) => updateParam('recursion', value)} />
            <Slider label="Tree Height" value={params.height} min={2} max={80} suffix="m" onChange={(value) => updateParam('height', value)} />
            <Slider label="Trunk Thickness" value={params.radius} min={0.1} max={5} onChange={(value) => updateParam('radius', value)} />
            <Slider label="Trunk Taper" value={params.taper} min={0.01} max={1} onChange={(value) => updateParam('taper', value)} />
            <Slider label="Leaf Density" value={params.leafCount} min={0} max={20000} step={100} onChange={(value) => updateParam('leafCount', value)} />
          </SectionCard>
          <SectionCard id="leaders" title="Leader System" helper="Leaders are dominant trunk-like splits that compete with the main axis." emphasis={true} activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Leader Count" value={params.leaderCount} min={0} max={4} step={1} onChange={(value) => updateParam('leaderCount', value)} />
            <Slider label="Leader Split Chance" value={params.leaderSplitChance} min={0} max={1} step={0.05} onChange={(value) => updateParam('leaderSplitChance', value)} />
            <Slider label="Leader Upward Bias" value={params.leaderUpwardBias} min={0} max={2} step={0.05} onChange={(value) => updateParam('leaderUpwardBias', value)} />
            <Slider label="Leader Dominance" value={params.leaderDominance} min={0} max={1.5} step={0.05} onChange={(value) => updateParam('leaderDominance', value)} />
          </SectionCard>
          <SectionCard id="primary" title="Primary Branches" helper="Shape the first true lateral branch layer, not the trunk itself." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Side Branch Count" value={params.levels[0]?.branchCount ?? 0} min={0} max={20} step={1} onChange={(value) => updateLevel(0, 'branchCount', value)} />
            <Slider label="Branch Angle" value={params.levels[0]?.branchAngle ?? 1} min={0.1} max={3} onChange={(value) => updateLevel(0, 'branchAngle', value)} />
            <Slider label="Branch Length" value={params.levels[0]?.lengthScale ?? 0.75} min={0.1} max={1.5} onChange={(value) => updateLevel(0, 'lengthScale', value)} />
            <Slider label="Branch Thickness Falloff" value={params.levels[0]?.radiusScale ?? 0.7} min={0.1} max={1} onChange={(value) => updateLevel(0, 'radiusScale', value)} />
          </SectionCard>
          <SectionCard id="preview" title="Preview" helper="Inspect the specimen from different task-oriented view modes." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
              Orbit the specimen directly in the viewport with your mouse or trackpad. Use the viewport <span className="font-black uppercase tracking-[0.18em] text-[color:var(--text-primary)]">Frame</span> action any time you want to recenter the view.
            </div>
          </SectionCard>
          <SectionCard id="variation" title="Variation" helper="Introduce controlled natural irregularity and seed-driven variation." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Seed" value={params.seed} min={0} max={2147483647} step={1} onChange={(value) => updateParam('seed', value)} />
            <Slider label="Leaf Scale" value={params.leafSize} min={0.05} max={1.5} onChange={(value) => updateParam('leafSize', value)} />
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard id="trunk-rules" title="True Trunk" helper="Fine tune trunk segmentation, curvature, and how the base axis behaves." emphasis={true} activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Resolution" value={params.levels[0]?.segments ?? 8} min={3} max={32} step={1} onChange={(value) => updateLevel(0, 'segments', value)} />
            <Slider label="Curvature" value={params.levels[0]?.curve ?? 0.5} min={0} max={2} onChange={(value) => updateLevel(0, 'curve', value)} />
            <Slider label="Upright Bias" value={params.trunkUprightStrength} min={0} max={1} step={0.05} onChange={(value) => updateParam('trunkUprightStrength', value)} />
            <Slider label="Noise Damping" value={params.trunkNoiseDamping} min={0} max={1} step={0.05} onChange={(value) => updateParam('trunkNoiseDamping', value)} />
            <Slider label="Lean Limit" value={params.trunkLeanLimit} min={0.02} max={0.5} step={0.01} onChange={(value) => updateParam('trunkLeanLimit', value)} />
            <Slider label="Split Blending" value={params.levels[0]?.splitSmoothness ?? 1} min={0} max={1} step={0.05} onChange={(value) => updateLevel(0, 'splitSmoothness', value)} />
          </SectionCard>
          <SectionCard id="leader-rules" title="Leader Rules" helper="Control where leaders emerge and how strongly they compete as major structural axes." emphasis={true} activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Leader Start Min" value={params.leaderStartMin} min={0} max={1} step={0.05} onChange={(value) => updateParam('leaderStartMin', value)} />
            <Slider label="Leader Start Max" value={params.leaderStartMax} min={0} max={1} step={0.05} onChange={(value) => updateParam('leaderStartMax', value)} />
            <Slider label="Leader Thickness Retention" value={params.leaderThicknessRetention} min={0.1} max={1.5} step={0.05} onChange={(value) => updateParam('leaderThicknessRetention', value)} />
            <Slider label="Leader Length Bias" value={params.leaderLengthBias} min={0.2} max={2} step={0.05} onChange={(value) => updateParam('leaderLengthBias', value)} />
            <Slider label="Leader Inheritance" value={params.leaderInheritance} min={0} max={1} step={0.05} onChange={(value) => updateParam('leaderInheritance', value)} />
            <Slider label="Leader Awareness Radius" value={params.leaderAwarenessRadius} min={0} max={30} step={0.1} onChange={(value) => updateParam('leaderAwarenessRadius', value)} />
            <Slider label="Projection Length" value={params.leaderProjectionLength} min={0.1} max={3} step={0.05} onChange={(value) => updateParam('leaderProjectionLength', value)} />
            <Slider label="Corridor Width" value={params.leaderCorridorWidth} min={0.1} max={5} step={0.05} onChange={(value) => updateParam('leaderCorridorWidth', value)} />
            <Slider label="Leader Repulsion" value={params.leaderRepulsionStrength} min={0} max={3} step={0.05} onChange={(value) => updateParam('leaderRepulsionStrength', value)} />
            <Slider label="Parallel Conflict" value={params.leaderParallelPenalty} min={0} max={2} step={0.05} onChange={(value) => updateParam('leaderParallelPenalty', value)} />
            <Slider label="Redundancy Penalty" value={params.leaderRedundancyPenalty} min={0} max={2} step={0.05} onChange={(value) => updateParam('leaderRedundancyPenalty', value)} />
            <Slider label="Yield Threshold" value={params.leaderYieldThreshold} min={0} max={1} step={0.05} onChange={(value) => updateParam('leaderYieldThreshold', value)} />
            <Slider label="Primary Protection" value={params.primaryLeaderProtection} min={0} max={1} step={0.05} onChange={(value) => updateParam('primaryLeaderProtection', value)} />
            <Slider label="Split Grace Distance" value={params.leaderGraceDistance} min={0} max={20} step={0.1} onChange={(value) => updateParam('leaderGraceDistance', value)} />
            <Slider label="Crown Separation" value={params.crownZoneSeparationStrength} min={0} max={2} step={0.05} onChange={(value) => updateParam('crownZoneSeparationStrength', value)} />
          </SectionCard>
          <SectionCard id="competition" title="Branch Awareness" helper="Make ordinary branches sense nearby occupancy, steer out of crowding, and lose vigor in congested zones." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <Slider label="Awareness Radius" value={params.branchAwarenessRadius} min={0} max={20} step={0.1} onChange={(value) => updateParam('branchAwarenessRadius', value)} />
            <Slider label="Exclusion Radius" value={params.branchExclusionRadius} min={0} max={6} step={0.05} onChange={(value) => updateParam('branchExclusionRadius', value)} />
            <Slider label="Repulsion Strength" value={params.branchRepulsionStrength} min={0} max={3} step={0.05} onChange={(value) => updateParam('branchRepulsionStrength', value)} />
            <Slider label="Crowding Penalty" value={params.branchCrowdingPenalty} min={0} max={1} step={0.05} onChange={(value) => updateParam('branchCrowdingPenalty', value)} />
            <Slider label="Crowded Tip Death" value={params.branchCrowdedDeathChance} min={0} max={1} step={0.05} onChange={(value) => updateParam('branchCrowdedDeathChance', value)} />
            <Slider label="Outward Escape Bias" value={params.branchOutwardBias} min={0} max={2} step={0.05} onChange={(value) => updateParam('branchOutwardBias', value)} />
          </SectionCard>
          <div className="space-y-3">
            <div className="px-1 text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-muted)]">Branch Layers</div>
            <LevelControls params={params} activeCategories={activeCategories} toggleCategory={toggleCategory} updateLevel={updateLevel} getLevelSummary={getLevelSummary} />
          </div>
          <SectionCard id="foliage" title="Terminal Growth" helper="Tune twig behavior, leaf coverage, and foliage attachment." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <ColorPicker label="Leaf Color" value={params.leafColor} onChange={(value) => updateParam('leafColor', value)} />
            <Slider label="Foliage Coverage" value={params.leafCount} min={0} max={20000} step={100} onChange={(value) => updateParam('leafCount', value)} />
            <Slider label="Leaf Scale" value={params.leafSize} min={0.05} max={1.5} onChange={(value) => updateParam('leafSize', value)} />
            <Slider label="Twig Density" value={params.twigDensity} min={0} max={20} step={1} onChange={(value) => updateParam('twigDensity', value)} />
          </SectionCard>
          <SectionCard id="bark" title="Bark Material" helper="Adjust the trunk material after the structure feels correct." activeCategories={activeCategories} toggleCategory={toggleCategory}>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker label="Base Color" value={params.barkColor} onChange={(value) => updateParam('barkColor', value)} />
              <ColorPicker label="Branch Tint" value={params.barkTint} onChange={(value) => updateParam('barkTint', value)} />
            </div>
            <Slider label="Fiber" value={params.fiberIntensity} min={0} max={1} onChange={(value) => updateParam('fiberIntensity', value)} />
            <Slider label="Cracks" value={params.crackDepth} min={0} max={1} onChange={(value) => updateParam('crackDepth', value)} />
            <Slider label="Moss" value={params.mossAmount} min={0} max={1} onChange={(value) => updateParam('mossAmount', value)} />
          </SectionCard>
        </>
      )}
    </div>
  )
}
