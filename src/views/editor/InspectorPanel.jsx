'use client'

import PresetPicker from './PresetPicker.jsx'
import { InspectorFieldList, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { getBuildWorkspaceSections, getWorkspaceSpec } from '../../models/botany/ui/workspaceSpecs.js'

export default function InspectorPanel({
  specimen,
  applyPreset,
  updatePath,
  presets,
  customDefinition,
}) {
  const activePresetKey = specimen.customSpecimenId ?? specimen.presetId ?? specimen.params?.name
  const workspace = getWorkspaceSpec('build')
  const sections = getBuildWorkspaceSections(customDefinition)

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
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
                  fields={section.fields}
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
