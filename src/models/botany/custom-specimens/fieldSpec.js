const DEFAULT_VISIBILITY = ['build', 'refine', 'editor']
const DEFAULT_INTENT = 'technical'
const DEFAULT_PRIORITY = 'advanced'

export const FIELD_WIDGETS = ['slider', 'select', 'toggle', 'color', 'text', 'textarea', 'number', 'code']

export const createFieldSpec = (spec = {}) => ({ ...spec })

export const normalizeVisibleIn = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [...DEFAULT_VISIBILITY]
  }

  return [...new Set(value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim().toLowerCase()))]
}

export const inferWidgetType = (field) => {
  if (!field || typeof field !== 'object') return 'text'
  if (field.widget && FIELD_WIDGETS.includes(field.widget)) return field.widget
  if (Array.isArray(field.options)) return 'select'
  if (typeof field.min === 'number' || typeof field.max === 'number' || typeof field.step === 'number') return 'slider'
  return 'text'
}

export const normalizeFieldSpec = (field, index = 0) => {
  const widget = inferWidgetType(field)
  const workspaceVisibility = normalizeVisibleIn(field.workspaceVisibility ?? field.visibleIn)
  return {
    path: field.path ?? '',
    label: field.label ?? field.path?.split('.').at(-1) ?? 'Field',
    widget,
    group: field.group ?? 'Advanced',
    order: field.order ?? index * 10,
    visibleIn: workspaceVisibility,
    workspaceVisibility,
    intent: field.intent ?? DEFAULT_INTENT,
    priority: field.priority ?? DEFAULT_PRIORITY,
    advanced: Boolean(field.advanced),
    readOnly: Boolean(field.readOnly),
    hidden: Boolean(field.hidden),
    min: field.min,
    max: field.max,
    step: field.step,
    options: Array.isArray(field.options) ? field.options.map((option) => (typeof option === 'string' ? { label: option, value: option } : option)) : undefined,
    help: field.help ?? '',
    placeholder: field.placeholder ?? '',
  }
}

export const normalizeFieldSpecs = (fields = []) => fields.map((field, index) => normalizeFieldSpec(field, index))

export const groupFieldSpecs = (fields = []) => {
  const grouped = new Map()

  normalizeFieldSpecs(fields).forEach((field) => {
    if (field.hidden) return
    const groupKey = field.group ?? 'Advanced'
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, [])
    }
    grouped.get(groupKey).push(field)
  })

  return Array.from(grouped.entries()).map(([group, items]) => ({
    id: group,
    title: group,
    helper: items.find((item) => item.help)?.help ?? '',
    fields: items.sort((left, right) => left.order - right.order),
  }))
}

export const isFieldVisibleIn = (field, activeTab) => {
  if (!field || field.hidden) return false
  return normalizeVisibleIn(field.workspaceVisibility ?? field.visibleIn).includes(String(activeTab ?? '').toLowerCase())
}
