'use client'

import { useMemo } from 'react'
import { InspectorField, InspectorFieldGroupList, InspectorSectionCard } from './FieldControls.jsx'
import { getIn } from '../../lib/objectPaths.js'
import { customSpecimenStore } from '../../models/botany/custom-specimens/store.js'
import { compileCustomSpecimenSource } from '../../models/botany/custom-specimens/runtime.js'

const VISIBILITY_OPTIONS = ['build', 'refine', 'editor']
const WIDGET_OPTIONS = ['slider', 'select', 'toggle', 'color', 'text', 'textarea', 'number', 'code']

function CheckboxRow({ label, value, onChange, disabled = false }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-[0.85rem] border border-white/40 bg-white/55 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--text-secondary)] ${disabled ? 'opacity-55' : ''}`}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[color:var(--accent-moss)]"
        disabled={disabled}
      />
    </label>
  )
}

function SelectRow({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="space-y-1 block text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
      <span>{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-[0.85rem] border border-white/50 bg-white/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)] outline-none disabled:opacity-55"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function ValueRow({ label, value, onChange, type = 'text', placeholder, disabled = false }) {
  return (
    <label className="space-y-1 block text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
        disabled={disabled}
        className="w-full rounded-[0.85rem] border border-white/50 bg-white/75 px-3 py-2 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--text-secondary)] outline-none disabled:opacity-55"
      />
    </label>
  )
}

function VisibleInRow({ value, onChange, disabled = false }) {
  const active = Array.isArray(value) ? value : []
  const toggle = (entry) => {
    if (disabled) return
    const next = active.includes(entry) ? active.filter((item) => item !== entry) : [...active, entry]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Visible In</div>
      <div className="flex flex-wrap gap-2">
        {VISIBILITY_OPTIONS.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => toggle(entry)}
            disabled={disabled}
            className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[0.22em] transition disabled:opacity-50 ${active.includes(entry) ? 'bg-[color:rgba(145,209,159,0.42)] text-[color:var(--text-primary)]' : 'bg-white/60 text-[color:var(--text-muted)]'}`}
          >
            {entry}
          </button>
        ))}
      </div>
    </div>
  )
}

function FieldSpecEditor({ field, index, onChange, onDelete, disabled = false }) {
  return (
    <div className="glass-panel rounded-[1rem] p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Field {index + 1}</div>
        <button type="button" onClick={onDelete} disabled={disabled} className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--accent-moss)] disabled:opacity-50">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ValueRow label="Path" value={field.path} onChange={(value) => onChange('path', value)} placeholder="params.windStrength" disabled={disabled} />
        <ValueRow label="Label" value={field.label} onChange={(value) => onChange('label', value)} placeholder="Wind Strength" disabled={disabled} />
        <SelectRow label="Widget" value={field.widget} options={WIDGET_OPTIONS} onChange={(value) => onChange('widget', value)} disabled={disabled} />
        <ValueRow label="Group" value={field.group} onChange={(value) => onChange('group', value)} placeholder="Leader System" disabled={disabled} />
        <ValueRow label="Order" type="number" value={field.order} onChange={(value) => onChange('order', Number.isNaN(value) ? 0 : value)} placeholder="10" disabled={disabled} />
        <ValueRow label="Help" value={field.help} onChange={(value) => onChange('help', value)} placeholder="What this field does..." disabled={disabled} />
        <ValueRow label="Min" type="number" value={field.min} onChange={(value) => onChange('min', value)} disabled={disabled} />
        <ValueRow label="Max" type="number" value={field.max} onChange={(value) => onChange('max', value)} disabled={disabled} />
        <ValueRow label="Step" type="number" value={field.step} onChange={(value) => onChange('step', value)} disabled={disabled} />
      </div>
      <VisibleInRow value={field.visibleIn} onChange={(value) => onChange('visibleIn', value)} disabled={disabled} />
      <div className="grid grid-cols-3 gap-2">
        <CheckboxRow label="Advanced" value={field.advanced} onChange={(value) => onChange('advanced', value)} disabled={disabled} />
        <CheckboxRow label="Read Only" value={field.readOnly} onChange={(value) => onChange('readOnly', value)} disabled={disabled} />
        <CheckboxRow label="Hidden" value={field.hidden} onChange={(value) => onChange('hidden', value)} disabled={disabled} />
      </div>
    </div>
  )
}

export default function CustomSpecimenEditorPanel({
  definitions,
  draft,
  selectedDefinitionId,
  catalogStatus,
  catalogError,
  selectDefinition,
  createBlankDefinition,
  cloneSelectedDefinition,
  saveDraft,
  deleteSelectedDefinition,
  toggleDefinitionEnabled,
  updateDraftPath,
  addField,
  updateField,
  removeField,
  applyDraftToSpecimen,
  exportDefinitions,
  importDefinitions,
}) {
  const customFields = draft ? draft.controlSchema ?? [] : []
  const previewParams = draft ? customSpecimenStore.createCustomSpecimenParams(draft) : {}
  const isLocked = Boolean(draft?.builtIn)
  const source = draft?.source ?? ''
  const compileError = useMemo(() => {
    if (!source.trim()) return 'Custom specimen source is empty.'
    try {
      compileCustomSpecimenSource(source)
      return draft?.compileError ?? null
    } catch (error) {
      return error instanceof Error ? error.message : 'Compilation failed.'
    }
  }, [source, draft?.compileError])

  return (
    <div className="greenhouse-scrollbar flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-[color:var(--text-secondary)]">
      {catalogStatus === 'error' ? (
        <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-secondary)]">
          Catalog error: {catalogError}
        </div>
      ) : catalogStatus === 'loading' ? (
        <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-muted)]">
          Loading custom specimen catalog...
        </div>
      ) : null}
      <InspectorSectionCard
        title="Custom Catalog"
        helper="Built-in templates are read-only; user specimens can be cloned, edited, and enabled."
        emphasis
        footer={(
          <div className="flex gap-2">
            <button type="button" onClick={createBlankDefinition} className="glass-button rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em]">New</button>
            <button type="button" onClick={cloneSelectedDefinition} className="glass-button rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em]">Clone</button>
            <button type="button" onClick={exportDefinitions} className="glass-button rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em]">Export</button>
          </div>
        )}
      >
        <div className="space-y-2">
          {definitions.map((definition) => (
            <button
              key={definition.id}
              type="button"
              onClick={() => selectDefinition(definition.id)}
              className={`glass-panel w-full rounded-[1rem] px-3 py-3 text-left transition ${selectedDefinitionId === definition.id ? 'ring-1 ring-[color:var(--accent-moss)]' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-primary)]">{definition.name}</div>
                  <div className="pt-1 text-[8px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                    {definition.sourceType === 'builtin' ? 'Built-in' : 'Custom'} · {definition.basePresetName ?? 'Pine'}
                  </div>
                </div>
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  {definition.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </InspectorSectionCard>

      {draft ? (
        <>
          <InspectorSectionCard
            title="Definition"
            helper="Metadata and base preset selection for the custom specimen."
            footer={(
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={saveDraft} disabled={isLocked} className="glass-button active rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] disabled:opacity-50">Save</button>
                <button type="button" onClick={applyDraftToSpecimen} className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em]">Apply</button>
                <button type="button" onClick={() => toggleDefinitionEnabled(draft.id, !draft.enabled)} disabled={isLocked} className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] disabled:opacity-50">{draft.enabled ? 'Disable' : 'Enable'}</button>
                {!draft.builtIn ? (
                  <button type="button" onClick={deleteSelectedDefinition} className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em]">Delete</button>
                ) : null}
                <button type="button" onClick={importDefinitions} className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em]">Import</button>
              </div>
            )}
          >
            <div className="grid grid-cols-2 gap-3">
              <ValueRow label="Name" value={draft.name} onChange={(value) => updateDraftPath('name', value)} disabled={isLocked} />
              <ValueRow label="Base Preset" value={draft.basePresetName} onChange={(value) => updateDraftPath('basePresetName', value)} disabled={isLocked} />
              <ValueRow label="Base Kind" value={draft.baseKind} onChange={(value) => updateDraftPath('baseKind', value)} disabled={isLocked} />
              <ValueRow label="Version" type="number" value={draft.version} onChange={(value) => updateDraftPath('version', Number.isNaN(value) ? 1 : value)} disabled={isLocked} />
            </div>
            <ValueRow label="Description" value={draft.description} onChange={(value) => updateDraftPath('description', value)} placeholder="Short explanation of the custom specimen." disabled={isLocked} />
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
              {compileError ? `Compile Error: ${compileError}` : 'Compilation ready.'}
            </div>
          </InspectorSectionCard>

          <InspectorSectionCard
            title="Inspector Fields"
            helper="These serialized fields become visible in the specimen inspector when this custom specimen is active."
            emphasis
            footer={(
              <button type="button" onClick={addField} disabled={isLocked} className="glass-button rounded-[0.95rem] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] disabled:opacity-50">Add Field</button>
            )}
          >
            {customFields.length ? customFields.map((field, index) => (
              <FieldSpecEditor
                key={`${field.path ?? 'field'}-${index}`}
                field={field}
                index={index}
                onChange={(key, value) => updateField(index, key, value)}
                onDelete={() => removeField(index)}
                disabled={isLocked}
              />
            )) : (
              <div className="glass-panel rounded-[1rem] px-4 py-3 text-[10px] leading-5 text-[color:var(--text-muted)]">
                No custom inspector fields yet. Add one to expose a slider, toggle, or select control.
              </div>
            )}
          </InspectorSectionCard>

          <InspectorSectionCard
            title="Generator Source"
            helper="This code runs once per generation and should return recipe patches based on the current field values."
          >
            <InspectorField
              field={{ path: 'source', label: 'Source', widget: 'code', help: 'Return an object with generate() and optional summarize() methods.', rows: 18 }}
              value={draft.source}
              onChange={(value) => updateDraftPath('source', value)}
              disabled={isLocked}
            />
          </InspectorSectionCard>

          <InspectorSectionCard
            title="Preview"
            helper="Read-only preview of how the current field schema will appear in the specimen inspector."
          >
            <InspectorFieldGroupList
              fields={customFields}
              activeTab="editor"
              valueGetter={(path) => getIn({ params: previewParams }, path)}
              onChange={() => {}}
              disabled
            />
          </InspectorSectionCard>
        </>
      ) : null}
    </div>
  )
}
