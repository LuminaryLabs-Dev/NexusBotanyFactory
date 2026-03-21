'use client'

import { InspectorField, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { getLevelInspectorFields } from '../../models/botany/ui/inspectorCatalog.js'

export default function LevelControls({ params, activeCategories, toggleCategory, updatePath, getLevelSummary }) {
  return Array.from({ length: params.recursion + 1 }).map((_, depth) => {
    const sectionId = `lvl-${depth}`
    const expanded = activeCategories.includes(sectionId)
    const fields = getLevelInspectorFields(depth)
    const title = depth === 0 ? 'Primary Branches' : `Branch Layer ${depth + 1}`
    const summary = expanded ? `Editing layer ${depth + 1}.` : getLevelSummary(depth)

    return (
      <InspectorSectionCard
        key={sectionId}
        title={title}
        helper={summary}
        footer={(
          <button
            type="button"
            onClick={() => toggleCategory(sectionId)}
            className="glass-button rounded-[0.85rem] px-3 py-2 text-[8px] font-black uppercase tracking-[0.22em]"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      >
        {expanded ? fields.map((field) => (
          <InspectorField
            key={field.path}
            field={field}
            value={getIn({ params }, field.path)}
            onChange={(nextValue) => updatePath(field.path, nextValue)}
            disabled={field.readOnly}
          />
        )) : null}
      </InspectorSectionCard>
    )
  })
}
