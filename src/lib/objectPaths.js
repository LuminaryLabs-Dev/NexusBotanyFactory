const PATH_TOKEN_PATTERN = /[^.[\]]+|\[(\d+)\]/g

const clone = (value) => {
  if (value === null || typeof value !== 'object') {
    return value
  }

  return Array.isArray(value)
    ? value.map((item) => clone(item))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]))
}

const parsePath = (path) => {
  if (typeof path !== 'string' || !path.trim()) {
    return []
  }

  const segments = []
  path.replace(PATH_TOKEN_PATTERN, (match, index) => {
    segments.push(index === undefined ? match : Number(index))
    return match
  })
  return segments
}

export const getIn = (source, path, fallback = undefined) => {
  const segments = parsePath(path)
  if (!segments.length) return source ?? fallback

  let current = source
  for (const segment of segments) {
    if (current == null) return fallback
    current = current[segment]
  }

  return current === undefined ? fallback : current
}

export const setIn = (source, path, value) => {
  const segments = parsePath(path)
  if (!segments.length) return clone(value)

  const root = Array.isArray(source) ? [...source] : { ...source }
  let current = root

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    if (isLast) {
      current[segment] = clone(value)
      return
    }

    const nextSegment = segments[index + 1]
    const existing = current[segment]
    if (existing == null || typeof existing !== 'object') {
      current[segment] = typeof nextSegment === 'number' ? [] : {}
    } else {
      current[segment] = Array.isArray(existing) ? [...existing] : { ...existing }
    }

    current = current[segment]
  })

  return root
}

export const updateAtPath = (source, path, updater) => setIn(source, path, updater(getIn(source, path)))

