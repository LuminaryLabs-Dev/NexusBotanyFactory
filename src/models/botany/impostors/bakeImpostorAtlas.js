import { getImpostorBakeFrames, resolveImpostorFrameLayout } from './impostorFrames.js'

const projectPoint = (point, yaw, pitch) => {
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)

  const x1 = (point.x * cosYaw) - (point.z * sinYaw)
  const z1 = (point.x * sinYaw) + (point.z * cosYaw)
  const y1 = (point.y * cosPitch) - (z1 * sinPitch)
  return { x: x1, y: y1 }
}

const dataUrlToByteArray = (dataUrl) => {
  const [, base64] = dataUrl.split(',')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const drawFrame = ({ context, generated, frame, frameWidth, frameHeight, bounds, barkColor, leafColor }) => {
  context.clearRect(0, 0, frameWidth, frameHeight)
  context.fillStyle = 'rgba(0, 0, 0, 0)'
  context.fillRect(0, 0, frameWidth, frameHeight)

  const projectedSkeleton = generated.treeData.skeleton.map((bone) => ({
    bone,
    point: projectPoint({
      x: bone.pos.x - bounds.center.x,
      y: bone.pos.y - bounds.min.y,
      z: bone.pos.z - bounds.center.z,
    }, frame.yaw, frame.pitch),
  }))

  const projectedLeaves = generated.treeData.leafInstances.map((leaf) => ({
    leaf,
    point: projectPoint({
      x: leaf.pos.x - bounds.center.x,
      y: leaf.pos.y - bounds.min.y,
      z: leaf.pos.z - bounds.center.z,
    }, frame.yaw, frame.pitch),
  }))

  const span = Math.max(bounds.size.x, bounds.size.y, bounds.size.z, 1)
  const scale = (frameWidth * 0.72) / span
  const toCanvas = (point) => ({
    x: (frameWidth * 0.5) + (point.x * scale),
    y: (frameHeight * 0.88) - (point.y * scale),
  })

  context.strokeStyle = barkColor
  context.lineCap = 'round'
  context.lineJoin = 'round'

  projectedSkeleton.forEach(({ bone, point }) => {
    if (bone.parentId == null || bone.parentId < 0) return
    const parent = projectedSkeleton.find((candidate) => candidate.bone.id === bone.parentId)
    if (!parent) return
    const a = toCanvas(parent.point)
    const b = toCanvas(point)
    context.lineWidth = Math.max(1, bone.radius * scale * 1.4)
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.stroke()
  })

  context.fillStyle = leafColor
  projectedLeaves.forEach(({ leaf, point }) => {
    const canvasPoint = toCanvas(point)
    const radius = Math.max(1.2, leaf.radius * scale * 2.2)
    context.save()
    context.translate(canvasPoint.x, canvasPoint.y)
    context.rotate(leaf.roll ?? 0)
    context.scale(1, 0.68)
    context.beginPath()
    context.arc(0, 0, radius * 2.3, 0, Math.PI * 2)
    context.fill()
    context.restore()
  })
}

export const bakeImpostorAtlas = (generated, descriptor, materialRecipe) => {
  const frameLayout = resolveImpostorFrameLayout(descriptor)
  if (typeof document === 'undefined' || !generated?.treeData || !frameLayout?.columns) {
    return null
  }

  const atlasWidth = frameLayout.columns * frameLayout.frameWidth
  const atlasHeight = frameLayout.rows * frameLayout.frameHeight
  const albedoCanvas = createCanvas(atlasWidth, atlasHeight)
  const maskCanvas = createCanvas(atlasWidth, atlasHeight)
  const normalCanvas = createCanvas(atlasWidth, atlasHeight)
  const albedoContext = albedoCanvas.getContext('2d')
  const maskContext = maskCanvas.getContext('2d')
  const normalContext = normalCanvas.getContext('2d')

  const frames = getImpostorBakeFrames(frameLayout)
  frames.forEach((frame) => {
    const frameX = frame.column * frameLayout.frameWidth
    const frameY = frame.row * frameLayout.frameHeight
    albedoContext.save()
    albedoContext.translate(frameX, frameY)
    drawFrame({
      context: albedoContext,
      generated,
      frame,
      frameWidth: frameLayout.frameWidth,
      frameHeight: frameLayout.frameHeight,
      bounds: generated.treeAsset.bounds,
      barkColor: materialRecipe?.bark?.barkColor ?? '#6e4a33',
      leafColor: materialRecipe?.foliage?.leafColor ?? '#4d8758',
    })
    albedoContext.restore()

    maskContext.save()
    maskContext.translate(frameX, frameY)
    drawFrame({
      context: maskContext,
      generated,
      frame,
      frameWidth: frameLayout.frameWidth,
      frameHeight: frameLayout.frameHeight,
      bounds: generated.treeAsset.bounds,
      barkColor: '#9f9f9f',
      leafColor: '#ffffff',
    })
    maskContext.restore()

    normalContext.fillStyle = 'rgba(128,128,255,1)'
    normalContext.fillRect(frameX, frameY, frameLayout.frameWidth, frameLayout.frameHeight)
  })

  const albedoAlphaDataUrl = albedoCanvas.toDataURL('image/png')
  const normalDataUrl = normalCanvas.toDataURL('image/png')
  const maskDepthDataUrl = maskCanvas.toDataURL('image/png')

  return {
    albedoCanvas,
    normalCanvas,
    maskCanvas,
    frameLayout,
    frameMapping: frames,
    albedoAlphaDataUrl,
    normalDataUrl,
    maskDepthDataUrl,
    albedoAlphaBytes: dataUrlToByteArray(albedoAlphaDataUrl),
    normalBytes: dataUrlToByteArray(normalDataUrl),
    maskDepthBytes: dataUrlToByteArray(maskDepthDataUrl),
  }
}
