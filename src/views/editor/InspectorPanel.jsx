'use client'

import { useState } from 'react'
import PresetPicker from './PresetPicker.jsx'
import { InspectorFieldList, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { getBuildWorkspaceSections } from '../../models/botany/ui/workspaceSpecs.js'
import { getSpeciesContract, getNativeInspectorSpecs } from '../../models/botany/schema/speciesContracts.js'
import { EDITOR_TRAIT_GROUPS, getFieldsForTraitGroup } from '../../models/botany/ui/nativeTraitGroups.js'

const labelFor = group => group === 'character' ? 'Character' : group.charAt(0).toUpperCase() + group.slice(1)

export default function InspectorPanel({ specimen, applyPreset, updatePath, presets, customDefinition, nativeValidation, randomizeTree, normalizeTree }) {
  const [activeGroup, setActiveGroup] = useState('character')
  const [showTechnical, setShowTechnical] = useState(false)
  const contract = specimen.kind === 'tree' ? getSpeciesContract(specimen.params?.name) : null
  const nativeSpecs = contract ? getNativeInspectorSpecs(specimen.params?.name) : []
  const fields = getFieldsForTraitGroup(nativeSpecs, activeGroup)
  const technicalSections = getBuildWorkspaceSections(customDefinition).filter(section => section.fields?.length)

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--text-muted)]">1 · Choose a tree</div>
        <PresetPicker presets={presets} activePresetKey={specimen.presetId ?? specimen.params.name} onApplyPreset={applyPreset}/>
      </div>
      {contract ? <>
        <div className="rounded-2xl bg-white/55 p-3 border border-[rgba(22,66,29,0.2)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div><h2 className="text-sm font-bold text-[color:var(--text-primary)]">{contract.commonName}</h2>
            <p className="text-[10px] italic">{contract.scientificName}</p></div>
            <button type="button" className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => applyPreset(specimen.params.name)}>Reset tree</button>
          </div>
          <button type="button" onClick={randomizeTree} className="w-full rounded-xl bg-[color:var(--accent-moss)] py-2.5 text-sm font-bold text-white">Remix this tree</button>
          <p className="text-[10px] leading-4 text-[color:var(--text-muted)]">Remix stays within the species profile. Adjust traits below to customize the result.</p>
        </div>
        {nativeValidation && !nativeValidation.valid ? <div role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          {nativeValidation.errors.slice(0,3).map((err,i)=><p key={i}>{err.message}</p>)}
          <button type="button" onClick={normalizeTree} className="mt-2 underline font-semibold">Normalize to native form</button>
        </div>:null}
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--text-muted)]">2 · Customize</div>
          <div role="tablist" aria-label="Tree parameter groups" className="flex flex-wrap gap-1">
            {Object.keys(EDITOR_TRAIT_GROUPS).map(group => <button type="button" role="tab" key={group}
              aria-selected={activeGroup === group} onClick={() => setActiveGroup(group)}
              className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${activeGroup===group?'bg-[#315c3b] text-white':'bg-white/70 text-[#34533c] border border-[#a6bfa8]'}`}>{labelFor(group)}</button>)}
          </div>
          <div role="tabpanel" aria-label={`${labelFor(activeGroup)} parameters`} className="space-y-3 rounded-2xl border border-[rgba(22,66,29,.2)] bg-white/50 p-3">
            <p className="text-xs text-[color:var(--text-muted)]">{activeGroup === 'character' ? 'The traits that define this tree’s silhouette.' : activeGroup === 'advanced' ? 'Growth age is separate from the optional animation study.' : `Adjust ${activeGroup} within the natural-style range.`}</p>
            <InspectorFieldList fields={fields.map(field => ({...field,visibleIn:['build']}))} activeTab="build" valueGetter={path => getIn(specimen,path)} onChange={updatePath}/>
            {fields.length === 0 && <p className="text-xs">No controls in this group.</p>}
          </div>
        </div>
      </> : <div className="text-xs">Choose a built-in species to edit its native traits.</div>}
      <div className="border-t border-white/40 pt-3">
        <button type="button" onClick={() => setShowTechnical(value => !value)} className="w-full rounded-xl border border-[rgba(22,66,29,.28)] p-3 text-left text-xs font-semibold" aria-expanded={showTechnical}>
          {showTechnical ? 'Hide technical controls −' : 'Show technical controls +'}
        </button>
        {showTechnical && <div className="space-y-3 pt-3">
          {technicalSections.map(section => <InspectorSectionCard key={section.id} title={section.title} helper={section.helper}>
            <InspectorFieldList fields={section.fields} activeTab="build" valueGetter={path => getIn(specimen,path)} onChange={updatePath}/>
          </InspectorSectionCard>)}
        </div>}
      </div>
    </div>
  )
}
