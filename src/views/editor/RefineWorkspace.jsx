'use client'

import LevelControls from './LevelControls.jsx'
import { InspectorFieldGroupList, InspectorSectionCard } from './FieldControls.jsx'
import { getRefineInspectorFields, getCustomInspectorFields } from '../../models/botany/ui/inspectorCatalog.js'
import { getIn } from '../../lib/objectPaths.js'

export default function RefineWorkspace({
  specimen,
  activeCategories,
  toggleCategory,
  updatePath,
  getLevelSummary,
  customDefinition,
}) {
  const refineFields = [...getRefineInspectorFields(), ...getCustomInspectorFields(customDefinition)]

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      <InspectorSectionCard
        title="Structural Refinement"
        helper="Tune the true trunk, leader behavior, branch competition, and terminal growth without the viewport in the way."
        emphasis
      >
        <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
          This workspace is for deeper structure tuning only. Use the global tabs to switch back to Build when you want the live Three.js preview.
        </div>
      </InspectorSectionCard>

      <InspectorFieldGroupList
        fields={refineFields}
        activeTab="refine"
        valueGetter={(path) => getIn(specimen, path)}
        onChange={updatePath}
      />

      <div className="space-y-3">
        <div className="px-1 text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-muted)]">Branch Layers</div>
        <LevelControls
          params={specimen.params}
          activeCategories={activeCategories}
          toggleCategory={toggleCategory}
          updatePath={updatePath}
          getLevelSummary={getLevelSummary}
        />
      </div>
    </div>
  )
}
