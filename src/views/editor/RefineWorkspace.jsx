'use client'

import LevelControls from './LevelControls.jsx'
import { InspectorFieldList, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { getRefineWorkspaceSections, getWorkspaceSpec } from '../../models/botany/ui/workspaceSpecs.js'

export default function RefineWorkspace({
  specimen,
  activeCategories,
  toggleCategory,
  updatePath,
  getLevelSummary,
  customDefinition,
}) {
  const workspace = getWorkspaceSpec('refine')
  const sections = getRefineWorkspaceSections(customDefinition)
  const branchLayerSection = sections.find((section) => section.id === 'branchLayers')
  const fieldSections = sections.filter((section) => section.id !== 'branchLayers' && workspace?.sectionOrder?.includes(section.id))

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

      {fieldSections.map((section) => (
        section.fields?.length ? (
          <InspectorSectionCard
            key={section.id}
            title={section.title}
            helper={section.helper}
            emphasis={section.priority === 'primary'}
          >
            <div className="space-y-3">
              <InspectorFieldList
                fields={section.fields}
                activeTab="refine"
                valueGetter={(path) => getIn(specimen, path)}
                onChange={updatePath}
              />
            </div>
          </InspectorSectionCard>
        ) : null
      ))}

      <InspectorSectionCard
        title={branchLayerSection?.title ?? 'Branch Layers'}
        helper={branchLayerSection?.helper ?? 'Primary and downstream branch tiers are tuned per layer below.'}
      >
        <div className="space-y-3">
          <LevelControls
            params={specimen.params}
            activeCategories={activeCategories}
            toggleCategory={toggleCategory}
            updatePath={updatePath}
            getLevelSummary={getLevelSummary}
          />
        </div>
      </InspectorSectionCard>
    </div>
  )
}
