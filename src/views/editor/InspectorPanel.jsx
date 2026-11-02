'use client'

import PresetPicker from './PresetPicker.jsx'
import { InspectorFieldList, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { getBuildWorkspaceSections, getWorkspaceSpec } from '../../models/botany/ui/workspaceSpecs.js'
import { getSpeciesContract, getNativeInspectorSpecs } from '../../models/botany/schema/speciesContracts.js'

export default function InspectorPanel({
  specimen,
  applyPreset,
  updatePath,
  presets,
  customDefinition,
  nativeValidation,
  randomizeTree,
  normalizeTree,
}) {
  const activePresetKey = specimen.customSpecimenId ?? specimen.presetId ?? specimen.params?.name
  const workspace = getWorkspaceSpec('build')
  const sections = getBuildWorkspaceSections(customDefinition)
  const contract = specimen.kind === 'tree' ? getSpeciesContract(specimen.params?.name) : null
  const nativeSpecs = contract ? getNativeInspectorSpecs(specimen.params?.name) : []
  const nativeFieldByPath = new Map(nativeSpecs.map(field => [field.path, field]))
  const signatureSpecs = nativeSpecs.filter(field => field.featured)
  const featuredPaths = new Set(signatureSpecs.map(field => field.path))

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      {contract && !customDefinition ? (
        <InspectorSectionCard title={`${contract.commonName} · Native Form`} helper={`${contract.scientificName} · ${contract.habit} · contract v${contract.version}`} emphasis>
          <p className="text-[10px] leading-5 text-[color:var(--text-muted)]">Natural variation bands are art-direction estimates, not established biological limits. Trunk radius scales with height.</p>
          <button type="button" onClick={randomizeTree} className="w-full rounded-xl bg-[color:var(--accent-moss)] px-3 py-2 text-[10px] font-bold text-white">Randomize Native Variation</button>
          {nativeValidation && !nativeValidation.valid ? (
            <div role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
              {nativeValidation.errors.slice(0, 3).map((err,index)=><p key={index}>{err.path}: {err.message}</p>)}
              <button type="button" onClick={normalizeTree} className="mt-2 rounded-lg border border-amber-600 px-2 py-1 font-bold">Normalize to Native Form</button>
            </div>
          ) : null}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest">Species Signature · Native Traits</div>
            <InspectorFieldList fields={signatureSpecs.map(field => ({...field,visibleIn:['build']}))} activeTab="build" valueGetter={path => getIn(specimen,path)} onChange={updatePath}/>
          </div>
        </InspectorSectionCard>
      ) : null}
      {sections
        .filter((section) => workspace?.sectionOrder?.includes(section.id))
        .map((section) => {
          if (section.id === 'phenotype') {
            return (
              <InspectorSectionCard
                key={section.id}
                title={section.title}
                helper={section.helper}
                emphasis={section.priority === 'primary'}
              >
                <PresetPicker
                  presets={presets}
                  activePresetKey={activePresetKey}
                  onApplyPreset={applyPreset}
                />
              </InspectorSectionCard>
            )
          }

          if (section.id === 'previewHelp') {
            return (
              <InspectorSectionCard
                key={section.id}
                title={section.title}
                helper={section.helper}
              >
                <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
                  Orbit with the mouse or trackpad, scroll to zoom, and use the viewport <span className="font-black uppercase tracking-[0.18em] text-[color:var(--text-primary)]">Frame</span> action to recenter the specimen.
                </div>
              </InspectorSectionCard>
            )
          }

          if (!section.fields?.length) {
            return null
          }

          return (
            <InspectorSectionCard
              key={section.id}
              title={section.title}
              helper={section.helper}
              emphasis={section.priority === 'primary'}
            >
              <div className="space-y-3">
                <InspectorFieldList
                  fields={section.fields.filter(field => !featuredPaths.has(field.path)).map(field => nativeFieldByPath.has(field.path) ? {...field,...nativeFieldByPath.get(field.path),visibleIn:field.visibleIn} : field)}
                  activeTab="build"
                  valueGetter={(path) => getIn(specimen, path)}
                  onChange={updatePath}
                />
              </div>
            </InspectorSectionCard>
          )
        })}
    </div>
  )
}
