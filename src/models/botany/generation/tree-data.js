import * as THREE from 'three'
import { mulberry32 } from './noise.js'

export const generateTreeData = (params, options = {}) => {
  const random = mulberry32(params.seed)
  const skeleton = []
  const nodes = []
  const anchorSegments = []
  const goldenAngle = 137.508 * (Math.PI / 180)
  const leafPlacementStrategy = options.leafPlacementStrategy
  const growthStrategy = options.growthStrategy
  const broadleafMode = options.mode === 'broadleaf'
  const coniferMode = options.mode === 'conifer'

  const isAnchor = (depth, t) => leafPlacementStrategy?.isAnchor({ params, depth, t })

  const grow = (startPos, startDir, length, radius, depth, parentBranchIdx = -1, parentBoneId = -1) => {
    if (depth > params.recursion || radius < 0.005 || length < 0.05) return

    const level = params.levels[Math.min(depth, params.levels.length - 1)]
    const segments = Math.max(3, level.segments)
    let currentPos = startPos.clone()
    let currentDir = startDir.clone().normalize()
    const nodePoints = []

    const initialBoneId = skeleton.length
    const rootBone = {
      id: initialBoneId,
      parentId: parentBoneId,
      pos: currentPos.clone(),
      dir: currentDir.clone(),
      radius,
      depth,
      length: 0,
      isTwig: false,
    }
    skeleton.push(rootBone)
    nodePoints.push({ ...rootBone, t: 0, boneId: initialBoneId })

    let previousBoneId = initialBoneId

    for (let index = 1; index <= segments; index += 1) {
      const t = index / segments
      const tropVec = new THREE.Vector3(0, 1, 0).multiplyScalar(params.tropismUp * 0.1)
      const gravVec = new THREE.Vector3(0, -1, 0).multiplyScalar(params.gravity * 0.15 * t)
      const noise = new THREE.Vector3((random() - 0.5) * level.curve, (random() - 0.5) * level.curve, (random() - 0.5) * level.curve).multiplyScalar(0.2)

      currentDir.add(tropVec).add(gravVec).add(noise).normalize()
      const stepLength = length / segments
      const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(stepLength))
      const currentRadius = radius * (1 - (t * (1 - params.taper)))

      const newBoneId = skeleton.length
      const bone = { id: newBoneId, parentId: previousBoneId, pos: nextPos.clone(), dir: currentDir.clone(), radius: currentRadius, depth, length: stepLength, isTwig: false }
      skeleton.push(bone)
      nodePoints.push({ ...bone, t, boneId: newBoneId })

      if (isAnchor?.(depth, t)) {
        anchorSegments.push(bone)
      }

      currentPos.copy(nextPos)
      previousBoneId = newBoneId
    }

    const nodeIdx = nodes.length
    nodes.push({ points: nodePoints, depth, parentIdx: parentBranchIdx })

    if (depth >= params.recursion) return

    const childCount = growthStrategy?.getChildCount(level.branchCount, random) ?? Math.max(0, Math.floor(level.branchCount + (random() * 0.5)))
    let currentSpin = random() * Math.PI * 2

    if (coniferMode || params.name === 'Pine' || params.leafStyle === 'needle') {
      const minT = depth === 0 ? 0.1 : 0.05
      for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
        const t = minT + (1 - minT) * ((childIndex + 0.5) / childCount)
        const spawnIdx = Math.floor(t * segments)
        const spawnPoint = nodePoints[spawnIdx]
        const coneTaper = 1 - (depth === 0 ? t : Math.pow(t, 0.4))
        const childLengthBase = depth === 0 ? params.height * level.lengthScale : length * level.lengthScale
        const childLength = childLengthBase * coneTaper * (0.8 + random() * 0.4)
        const childRadius = spawnPoint.radius * level.radiusScale * (0.8 + random() * 0.3)
        if (childLength <= 0.1 || childRadius <= 0.005) continue

        const spawnDir = spawnPoint.dir.clone()
        if (depth === 0) {
          let axis = new THREE.Vector3(0, 0, 1).cross(spawnDir).normalize()
          if (axis.lengthSq() < 0.1) axis.set(1, 0, 0)
          spawnDir.applyAxisAngle(axis, level.branchAngle)
          spawnDir.applyAxisAngle(spawnPoint.dir, currentSpin)
          currentSpin += goldenAngle * (growthStrategy?.getGoldenAngleMultiplier() ?? 2)
          const horizontal = new THREE.Vector3(spawnDir.x, 0.05, spawnDir.z).normalize()
          spawnDir.lerp(horizontal, 0.8).normalize()
        } else {
          const up = new THREE.Vector3(0, 1, 0)
          const side = new THREE.Vector3().crossVectors(up, spawnPoint.dir).normalize()
          if (side.lengthSq() < 0.01) side.set(1, 0, 0)
          if (childIndex % 2 === 0) side.negate()
          spawnDir.lerp(side, level.branchAngle * 0.9).normalize()
          spawnDir.y += 0.2
          spawnDir.normalize()
        }
        grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId)
      }
    } else {
      for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
        const minT = depth === 0 ? 0.2 : 0.1
        const t = minT + (1 - minT) * ((childIndex + 0.5) / childCount)
        const spawnIdx = Math.floor(t * segments)
        const spawnPoint = nodePoints[spawnIdx]
        const ageFactor = 1 - t
        const energyRatio = broadleafMode
          ? THREE.MathUtils.lerp(0.3 + (0.7 * ageFactor), 0.4, level.apicalControl ?? 0.5)
          : THREE.MathUtils.lerp(0.5 + (0.5 * ageFactor), 0.4, level.apicalControl ?? 0.5)
        const childLength = (depth === 0 ? params.height * level.lengthScale : length * level.lengthScale) * energyRatio * (0.8 + random() * 0.4)
        const childRadius = spawnPoint.radius * level.radiusScale * (0.8 + random() * 0.3)
        if (childLength <= 0.1 || childRadius <= 0.005) continue

        const spawnDir = spawnPoint.dir.clone()
        let axis = new THREE.Vector3(0, 1, 0).cross(spawnDir).normalize()
        if (axis.length() < 0.1) axis.set(1, 0, 0)
        spawnDir.applyAxisAngle(axis, level.branchAngle * (1 - (0.3 * t)) + ((random() - 0.5) * 0.2))
        spawnDir.applyAxisAngle(spawnPoint.dir, currentSpin)
        currentSpin += goldenAngle + ((random() - 0.5) * 0.2)
        grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId)
      }
    }
  }

  grow(new THREE.Vector3(0, 1.25, 0), new THREE.Vector3(0, 1, 0), params.height, params.radius, 0, -1, -1)

  const twigLeafAnchors = []
  const maxTwigSpawns = Math.min(anchorSegments.length, 1200)
  const selectedAnchors = []
  for (let index = 0; index < maxTwigSpawns; index += 1) {
    selectedAnchors.push(anchorSegments[Math.floor(Math.pow(random(), 0.6) * anchorSegments.length)])
  }

  selectedAnchors.forEach((anchorBone) => {
    const density = params.twigDensity ?? 3
    for (let index = 0; index < density; index += 1) {
      let currentPos = anchorBone.pos.clone()
      let currentDir
      if (params.leafStyle === 'needle') {
        const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), anchorBone.dir).normalize()
        if (side.length() < 0.1) side.set(1, 0, 0)
        if (index % 2 === 0) side.negate()
        currentDir = anchorBone.dir.clone().lerp(side, 0.4 + random() * 0.4).normalize()
      } else {
        const spreadAxis = new THREE.Vector3(0, 1, 0).cross(anchorBone.dir).normalize()
        if (spreadAxis.length() < 0.1) spreadAxis.set(1, 0, 0)
        currentDir = anchorBone.dir.clone().applyAxisAngle(spreadAxis, (random() - 0.1) * 1.5).applyAxisAngle(anchorBone.dir, random() * Math.PI * 2).normalize()
      }

      let parentBoneId = anchorBone.id
      const totalTwigLen = (params.twigLength ?? 1) * anchorBone.radius * 6
      const stepLen = totalTwigLen / 3
      const twigPath = []

      for (let twigIndex = 1; twigIndex <= 3; twigIndex += 1) {
        const t = twigIndex / 3
        currentDir
          .add(new THREE.Vector3(0, 1, 0).multiplyScalar((params.twigPhototropism ?? 0.8) * 0.5))
          .add(new THREE.Vector3(0, -1, 0).multiplyScalar((params.twigGravity ?? 0.2) * 0.5))
          .normalize()
        const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(stepLen))
        const newBoneId = skeleton.length
        const bone = { id: newBoneId, parentId: parentBoneId, pos: nextPos.clone(), dir: currentDir.clone(), radius: anchorBone.radius * 0.1 * (1 - t), depth: anchorBone.depth + 1, length: stepLen, isTwig: true, t }
        skeleton.push(bone)
        twigPath.push(bone)
        currentPos.copy(nextPos)
        parentBoneId = newBoneId
      }

      const arrangement = params.leafArrangement || 'alternate'
      if (arrangement === 'terminal') twigLeafAnchors.push({ bone: twigPath[2], type: 'terminal' })
      else if (arrangement === 'alternate') twigPath.forEach((bone, anchorIndex) => twigLeafAnchors.push({ bone, type: 'alternate', flip: anchorIndex % 2 === 0 }))
      else if (arrangement === 'opposite') twigPath.forEach((bone) => {
        twigLeafAnchors.push({ bone, type: 'opposite1' })
        twigLeafAnchors.push({ bone, type: 'opposite2' })
      })
    }
  })

  const leafInstances = []
  if (twigLeafAnchors.length > 0 && params.leafCount > 0) {
    for (let index = 0; index < Math.min(params.leafCount, 25000); index += 1) {
      const anchor = twigLeafAnchors[Math.floor(random() * twigLeafAnchors.length)]
      const bone = anchor.bone
      let angle = random() * Math.PI * 2
      let pitch = random()

      if (anchor.type === 'alternate') {
        angle = anchor.flip ? 0 : Math.PI
        angle += (random() - 0.5) * 0.5
        pitch = 0.2 + random() * 0.3
      } else if (anchor.type.startsWith('opposite')) {
        angle = (anchor.type === 'opposite1' ? 0 : Math.PI) + ((random() - 0.5) * 0.3)
        pitch = 0.2 + random() * 0.3
      }

      leafInstances.push({
        pos: bone.pos.clone(),
        dir: bone.dir.clone(),
        radius: bone.radius,
        angle,
        pitch,
        roll: random() * Math.PI * 2,
        boneId: bone.id,
      })
    }
  }

  return { nodes, skeleton, leafInstances }
}
