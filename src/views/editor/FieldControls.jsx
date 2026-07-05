'use client'

import { groupFieldSpecs, isFieldVisibleIn } from '../../models/botany/custom-specimens/fieldSpec.js'

export function InspectorSectionCard({ title, helper, emphasis = false, children, footer }) {
  return (
    <div className={`${emphasis ? 'glass-panel-strong' : 'glass-panel'} rounded-[1.35rem] px-4 py-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[color:var(--text-secondary)]">{title}</div>
          {helper ? <div className="pt-1 text-[10px] font-medium leading-5 text-[color:var(--text-muted)]">{helper}</div> : null}
        </div>
      </div>
      <div className="pt-4 space-y-3">{children}</div>
      {footer ? <div className="pt-4">{footer}</div> : null}
    </div>
  )
}

const SelectWidget = ({ field, value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    className="w-full rounded-[0.85rem] border border-white/50 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)] outline-none transition disabled:opacity-50"
  >
    {(field.options ?? []).map((option) => {
      const optionValue = typeof option === 'string' ? option : option.value ?? option.label
      const optionLabel = typeof option === 'string' ? option : option.label ?? option.value
      return <option key={optionValue} value={optionValue}>{optionLabel}</option>
    })}
  </select>
)

const ToggleWidget = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    disabled={disabled}
    className={`flex items-center gap-2 rounded-[0.85rem] border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition disabled:opacity-50 ${value ? 'border-[color:var(--accent-moss)] bg-[color:rgba(145,209,159,0.35)] text-[color:var(--text-primary)]' : 'border-white/40 bg-white/55 text-[color:var(--text-secondary)]'}`}
  >
    <span className={`h-2.5 w-2.5 rounded-full ${value ? 'bg-[color:var(--accent-moss)]' : 'bg-[color:var(--text-muted)]'}`} />
    {value ? 'On' : 'Off'}
  </button>
)

const TextWidget = ({ field, value, onChange, disabled }) => (
  <input
    type={field.widget === 'number' ? 'number' : 'text'}
    value={value ?? ''}
    placeholder={field.placeholder ?? ''}
    min={field.min}
    max={field.max}
    step={field.step ?? (field.widget === 'number' ? 1 : undefined)}
    onChange={(event) => onChange(field.widget === 'number' ? Number(event.target.value) : event.target.value)}
    disabled={disabled}
    className="w-full rounded-[0.85rem] border border-white/50 bg-white/70 px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-[color:var(--text-secondary)] outline-none transition disabled:opacity-50"
  />
)

export function InspectorField({ field, value, onChange, disabled = false }) {
  if (!field || field.hidden) {
    return null
  }

  const labelRow = (
    <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
      <label className="truncate pr-2">{field.label}</label>
      {!['toggle', 'select', 'text', 'textarea', 'code'].includes(field.widget) ? (
        <span className="font-mono shrink-0 text-[color:var(--accent-moss)]">{value}{field.unit ?? ''}</span>
      ) : null}
    </div>
  )

  switch (field.widget) {
    case 'slider':
      return (
        <div className="space-y-1 w-full">
          {labelRow}
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step ?? 0.1}
            value={value}
            onChange={(event) => onChange(field.integer ? Number.parseInt(event.target.value, 10) : Number.parseFloat(event.target.value))}
            disabled={disabled}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,rgba(132,176,143,0.34),rgba(255,255,255,0.8),rgba(132,176,143,0.34))] accent-[color:var(--accent-moss)]"
          />
          {field.help ? <div className="pt-1 text-[9px] leading-4 text-[color:var(--text-muted)]">{field.help}</div> : null}
        </div>
      )
    case 'select':
      return (
        <div className="space-y-1 w-full">
          {labelRow}
          <SelectWidget field={field} value={value} onChange={onChange} disabled={disabled} />
          {field.help ? <div className="pt-1 text-[9px] leading-4 text-[color:var(--text-muted)]">{field.help}</div> : null}
        </div>
      )
    case 'toggle':
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          {labelRow}
          <ToggleWidget value={Boolean(value)} onChange={onChange} disabled={disabled} />
        </div>
      )
    case 'color':
      return (
        <div className="flex items-center justify-between gap-3 w-full">
          {labelRow}
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="h-7 w-7 cursor-pointer rounded-full border border-white/60 bg-transparent p-0 shadow-[0_6px_14px_rgba(82,112,88,0.16)] disabled:opacity-50"
          />
        </div>
      )
    case 'number':
    case 'text':
      return (
        <div className="space-y-1 w-full">
          {labelRow}
          <TextWidget field={field} value={value} onChange={onChange} disabled={disabled} />
          {field.help ? <div className="pt-1 text-[9px] leading-4 text-[color:var(--text-muted)]">{field.help}</div> : null}
        </div>
      )
    case 'textarea':
    case 'code':
      return (
        <div className="space-y-1 w-full">
          {labelRow}
          <textarea
            value={value ?? ''}
            rows={field.rows ?? 6}
            placeholder={field.placeholder ?? ''}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="w-full rounded-[0.95rem] border border-white/50 bg-white/75 px-3 py-2 text-[10px] leading-5 tracking-[0.04em] text-[color:var(--text-secondary)] outline-none transition disabled:opacity-50"
          />
          {field.help ? <div className="pt-1 text-[9px] leading-4 text-[color:var(--text-muted)]">{field.help}</div> : null}
        </div>
      )
    default:
      return null
  }
}

export function InspectorFieldList({ fields, activeTab, valueGetter, onChange, disabled = false }) {
  return fields
    .filter((field) => isFieldVisibleIn(field, activeTab))
    .map((field) => (
      <InspectorField
        key={field.path}
        field={field}
        value={valueGetter(field.path)}
        onChange={(nextValue) => onChange(field.path, nextValue)}
        disabled={disabled || field.readOnly}
      />
    ))
}

export function InspectorFieldGroupList({ fields, activeTab, valueGetter, onChange, disabled = false }) {
  const groups = groupFieldSpecs(fields).filter((group) => group.fields.some((field) => isFieldVisibleIn(field, activeTab)))

  return (
    <>
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{group.title}</div>
          {group.helper ? <div className="text-[9px] leading-4 text-[color:var(--text-muted)]">{group.helper}</div> : null}
          <div className="space-y-3">
            <InspectorFieldList
              fields={group.fields}
              activeTab={activeTab}
              valueGetter={valueGetter}
              onChange={onChange}
              disabled={disabled}
            />
          </div>
        </div>
      ))}
    </>
  )
}
