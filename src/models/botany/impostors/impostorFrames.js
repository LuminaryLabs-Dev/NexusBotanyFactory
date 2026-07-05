import * as THREE from 'three'

const TAU = Math.PI * 2

const clampIndex = (value, length) => {
  if (length <= 0) return 0
  const wrapped = value % length
  return wrapped < 0 ? wrapped + length : wrapped
}

const buildImpostorFrameMapping = (layout) => {
  const frames = []
  for (let row = 0; row < layout.rows; row += 1) {
    const pitchDegrees = layout.elevationBands[row] ?? layout.elevationBands[layout.elevationBands.length - 1] ?? 0
    for (let azimuthIndex = 0; azimuthIndex < layout.azimuthSteps; azimuthIndex += 1) {
      const column = azimuthIndex
      const frameIndex = (row * layout.columns) + column
      frames.push({
        index: frameIndex,
        row,
        column,
        azimuthIndex,
        elevationIndex: row,
        yaw: (TAU * azimuthIndex) / layout.azimuthSteps,
        pitch: (pitchDegrees * Math.PI) / 180,
        pitchDegrees,
        frameRect: {
          frameIndex,
          row,
          column,
          x: column * layout.frameWidth,
          y: row * layout.frameHeight,
          width: layout.frameWidth,
          height: layout.frameHeight,
          u0: column / layout.columns,
          v0: 1 - ((row + 1) / layout.rows),
          u1: (column + 1) / layout.columns,
          v1: 1 - (row / layout.rows),
        },
      })
    }
  }
  return frames
}

export const resolveImpostorFrameLayout = (descriptor = {}) => {
  const sourceLayout = descriptor.frameLayout ?? descriptor.atlas ?? descriptor
  const elevationBands = Array.isArray(sourceLayout.elevationBands)
    ? [...sourceLayout.elevationBands]
    : Array.isArray(descriptor.elevationBands)
      ? [...descriptor.elevationBands]
      : [-12, 24]

  const azimuthSteps = Number(sourceLayout.azimuthSteps ?? descriptor.azimuthSteps ?? sourceLayout.columns ?? 8)
  const columns = Number(sourceLayout.columns ?? descriptor.columns ?? azimuthSteps)
  const rows = Number(sourceLayout.rows ?? descriptor.rows ?? elevationBands.length)
  const frameWidth = Number(sourceLayout.frameWidth ?? descriptor.frameWidth ?? 256)
  const frameHeight = Number(sourceLayout.frameHeight ?? descriptor.frameHeight ?? 256)

  return {
    columns,
    rows,
    frameWidth,
    frameHeight,
    azimuthSteps,
    elevationBands,
    frameCount: columns * rows,
  }
}

export const getImpostorFrameAnchor = (pivot, descriptor = {}) => {
  const base = pivot instanceof THREE.Vector3
    ? pivot.clone()
    : new THREE.Vector3(pivot?.x ?? 0, pivot?.y ?? 0, pivot?.z ?? 0)
  const offset = descriptor.pivotOffset ?? descriptor.frameAnchorOffset ?? null
  if (!offset) {
    return base
  }

  return base.add(new THREE.Vector3(offset.x ?? 0, offset.y ?? 0, offset.z ?? 0))
}

export const getImpostorBakeFrames = (descriptor = {}) => {
  const layout = resolveImpostorFrameLayout(descriptor)
  return buildImpostorFrameMapping(layout)
}

export const getImpostorFrameUvRect = (frameIndex, descriptor = {}) => {
  const layout = resolveImpostorFrameLayout(descriptor)
  const safeIndex = layout.frameCount > 0 ? clampIndex(frameIndex, layout.frameCount) : 0
  const row = Math.floor(safeIndex / layout.columns)
  const column = safeIndex % layout.columns
  const u0 = column / layout.columns
  const u1 = (column + 1) / layout.columns
  const v0 = 1 - ((row + 1) / layout.rows)
  const v1 = 1 - (row / layout.rows)

  return {
    frameIndex: safeIndex,
    row,
    column,
    x: column * layout.frameWidth,
    y: row * layout.frameHeight,
    width: layout.frameWidth,
    height: layout.frameHeight,
    u0,
    v0,
    u1,
    v1,
  }
}

export const getImpostorFrameSelection = (cameraPosition, pivot, descriptor = {}) => {
  const layout = resolveImpostorFrameLayout(descriptor)
  const anchor = getImpostorFrameAnchor(pivot, descriptor)
  const camera = cameraPosition instanceof THREE.Vector3
    ? cameraPosition
    : new THREE.Vector3(cameraPosition?.x ?? 0, cameraPosition?.y ?? 0, cameraPosition?.z ?? 0)

  const direction = camera.clone().sub(anchor)
  if (direction.lengthSq() < 1e-10) {
    direction.set(0, 1, 1)
  }
  direction.normalize()

  const horizontalLength = Math.max(Math.sqrt((direction.x ** 2) + (direction.z ** 2)), 1e-6)
  const azimuth = Math.atan2(direction.x, direction.z)
  const azimuthNormalized = azimuth < 0 ? azimuth + TAU : azimuth
  const azimuthIndex = clampIndex(Math.round((azimuthNormalized / TAU) * layout.azimuthSteps), layout.azimuthSteps)
  const elevationDegrees = Math.atan2(direction.y, horizontalLength) * (180 / Math.PI)

  let elevationIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  layout.elevationBands.forEach((pitchDegrees, row) => {
    const distance = Math.abs(pitchDegrees - elevationDegrees)
    if (distance < bestDistance) {
      bestDistance = distance
      elevationIndex = row
    }
  })

  const frameIndex = (elevationIndex * layout.columns) + azimuthIndex
  const frameRect = getImpostorFrameUvRect(frameIndex, layout)

  return {
    anchor,
    direction,
    azimuthDegrees: azimuthNormalized * (180 / Math.PI),
    elevationDegrees,
    azimuthIndex,
    elevationIndex,
    frameIndex,
    frameRect,
  }
}
