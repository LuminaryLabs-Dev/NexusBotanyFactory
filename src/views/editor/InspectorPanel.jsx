'use client'

import PresetPicker from './PresetPicker.jsx'
import { InspectorFieldGroupList, InspectorSectionCard } from './FieldControls.jsx'
import { getBuildInspectorFields, getCustomInspectorFields } from '../../models/botany/ui/inspectorCatalog.js'
import { getIn } from '../../lib/objectPaths.js'

export default function InspectorPanel({
  specimen,
  applyPreset,
  updatePath,
  presets,
  customDefinition,
}) {
  const buildFields = [...getBuildInspectorFields(), ...getCustomInspectorFields(customDefinition)]
  const activePresetKey = specimen.customSpecimenId ?? specimen.presetId ?? specimen.params?.name

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      <InspectorSectionCard
        title="Phenotype"
        helper="Start with the species archetype and overall growth personality."
        emphasis
      >
        <PresetPicker
          presets={presets}
          activePresetKey={activePresetKey}
          onApplyPreset={applyPreset}
        />
      </InspectorSectionCard>
      <InspectorFieldGroupList
        fields={buildFields}
        activeTab="build"
        valueGetter={(path) => getIn(specimen, path)}
        onChange={updatePath}
      />
      <InspectorSectionCard
        title="Preview"
        helper="Orbit the specimen directly in the viewport with your mouse or trackpad."
      >
        <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
          Use the viewport <span className="font-black uppercase tracking-[0.18em] text-[color:var(--text-primary)]">Frame</span> action any time you want to recenter the view.
        </div>
      </InspectorSectionCard>
    </div>
  )
}
