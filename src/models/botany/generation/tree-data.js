import * as THREE from 'three'
import { mulberry32 } from './noise.js'

const UP = new THREE.Vector3(0, 1, 0)
const EPSILON = 0.0001

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1)

const closestPointOnSegment = (point, start, end) => {
  const segment = end.clone().sub(start)
  const denominator = segment.lengthSq()
  if (denominator < EPSILON) return start.clone()
  const t = clamp01(point.clone().sub(start).dot(segment) / denominator)
  return start.clone().add(segment.multiplyScalar(t))
}

const randomUnitVector = (random) => new THREE.Vector3(
  (random() - 0.5) * 2,
  (random() - 0.5) * 2,
  (random() - 0.5) * 2,
).normalize()

const createCommittedSegment = ({ start, end, dir, radius, depth, axisId, isLeader, leaderClass, parentAxisId }) => ({
  start: start.clone(),
  end: end.clone(),
  dir: dir.clone(),
  radius,
  depth,
  axisId,
  isLeader,
  leaderClass,
  parentAxisId,
})

const computeBranchAwareness = ({
  params,
  candidatePos,
  currentDir,
  currentPos,
  axisId,
  isLeader,
  leaderClass,
  parentAxisId,
  committedSegments,
  leaderCorridors,
  random,
}) => {
  const awarenessRadius = params.branchAwarenessRadius ?? 0
  const exclusionRadius = params.branchExclusionRadius ?? 0.5
  const repulsionStrength = params.branchRepulsionStrength ?? 0
  const crowdingPenalty = params.branchCrowdingPenalty ?? 0
  const deathChance = params.branchCrowdedDeathChance ?? 0
  const outwardBias = params.branchOutwardBias ?? 0

  if (awarenessRadius <= 0 || repulsionStrength <= 0) {
    return {
      direction: currentDir.clone(),
      stepScale: 1,
      terminate: false,
      crowding: 0,
    }
  }

  const repulsion = new THREE.Vector3()
  let crowding = 0

  committedSegments.forEach((segment) => {
    if (segment.axisId === axisId) return

    const closest = closestPointOnSegment(candidatePos, segment.start, segment.end)
    const toCandidate = candidatePos.clone().sub(closest)
    const distance = Math.max(toCandidate.length(), EPSILON)
    const influenceRadius = awarenessRadius + segment.radius
    if (distance > influenceRadius) return

    const proximity = 1 - clamp01((distance - exclusionRadius) / Math.max(influenceRadius - exclusionRadius, EPSILON))
    if (proximity <= 0) return

    const towardOccupied = closest.clone().sub(currentPos).normalize()
    const forwardWeight = THREE.MathUtils.clamp((currentDir.dot(towardOccupied) + 0.35) / 1.35, 0.1, 1)
    const siblingWeight = segment.parentAxisId === parentAxisId ? 0.72 : 1
    const leaderWeight = isLeader || segment.isLeader ? 1.15 : 1
    const thicknessWeight = THREE.MathUtils.clamp(segment.radius * 2.4, 0.5, 2)
    const strength = proximity * forwardWeight * siblingWeight * leaderWeight * thicknessWeight

    repulsion.add((distance > EPSILON ? toCandidate.normalize() : randomUnitVector(random)).multiplyScalar(strength))
    crowding += strength * 0.24
  })

  if (leaderCorridors.length > 0) {
    leaderCorridors.forEach((corridor) => {
      if (!corridor.active || corridor.axisId === axisId) return
      const projected = corridor.end.clone().sub(candidatePos)
      const distance = projected.length()
      if (distance > corridor.width + awarenessRadius) return
      const alignment = Math.max(0, currentDir.dot(projected.normalize()))
      if (alignment <= 0) return
      const proximity = 1 - clamp01(distance / Math.max(corridor.width + awarenessRadius, EPSILON))
      const strength = proximity * alignment * 0.9
      repulsion.add(candidatePos.clone().sub(corridor.end).normalize().multiplyScalar(strength))
      crowding += strength * 0.18
    })
  }

  const outward = new THREE.Vector3(candidatePos.x, 0, candidatePos.z)
  if (outward.lengthSq() > EPSILON) {
    repulsion.add(outward.normalize().multiplyScalar(outwardBias * (0.35 + crowding)))
  }

  const adjustedDirection = currentDir.clone()
    .multiplyScalar(1.25)
    .add(repulsion.multiplyScalar(repulsionStrength))
    .normalize()

  const stepScale = THREE.MathUtils.clamp(1 - (crowding * crowdingPenalty), 0.38, 1)
  const terminateThreshold = 0.9 + ((isLeader ? 0.12 : 0) * (leaderClass === 'primary' ? 1 : 0))
  const terminate = crowding > terminateThreshold && random() < Math.min(1, deathChance + ((crowding - terminateThreshold) * 0.25))

  return {
    direction: adjustedDirection,
    stepScale,
    terminate,
    crowding,
  }
}

const resolveLeaderRoots = (roots, params) => {
  const projectionLength = params.leaderProjectionLength ?? 1
  const corridorWidth = params.leaderCorridorWidth ?? 1.2
  const repulsionStrength = params.leaderRepulsionStrength ?? 1
  const parallelPenalty = params.leaderParallelPenalty ?? 0.8
  const redundancyPenalty = params.leaderRedundancyPenalty ?? 0.8
  const yieldThreshold = params.leaderYieldThreshold ?? 0.4
  const primaryProtection = params.primaryLeaderProtection ?? 0.7
  const graceDistance = params.leaderGraceDistance ?? 4
  const crownSeparation = params.crownZoneSeparationStrength ?? 0.8

  const activeRoots = roots.filter((root) => root.active)
  for (let index = 0; index < activeRoots.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < activeRoots.length; compareIndex += 1) {
      const left = activeRoots[index]
      const right = activeRoots[compareIndex]
      const leftEnd = left.pos.clone().add(left.dir.clone().multiplyScalar(left.length * projectionLength))
      const rightEnd = right.pos.clone().add(right.dir.clone().multiplyScalar(right.length * projectionLength))
      const endDistance = leftEnd.distanceTo(rightEnd)
      const spawnDistance = left.pos.distanceTo(right.pos)
      const parallel = clamp01((left.dir.dot(right.dir) + 1) / 2)
      const overlap = 1 - clamp01(endDistance / Math.max(corridorWidth * 8, EPSILON))
      const graceFactor = clamp01((Math.max(spawnDistance, endDistance * 0.4) - (graceDistance * 0.2)) / Math.max(graceDistance * 0.8, EPSILON))
      const corridorConflict = overlap * parallel * graceFactor
      if (corridorConflict < yieldThreshold) continue

      const leftScore = left.dominance * (left.leaderClass === 'primary' ? 1 + primaryProtection : 1)
      const rightScore = right.dominance * (right.leaderClass === 'primary' ? 1 + primaryProtection : 1)
      const stronger = leftScore >= rightScore ? left : right
      const weaker = stronger === left ? right : left

      const pushAxis = stronger.pos.clone().sub(weaker.pos)
      const lateralBase = pushAxis.lengthSq() > EPSILON
        ? pushAxis.normalize()
        : new THREE.Vector3().crossVectors(stronger.dir, UP).normalize()
      const strongerEscape = new THREE.Vector3().crossVectors(UP, stronger.dir).normalize()
      if (strongerEscape.lengthSq() < EPSILON) strongerEscape.set(1, 0, 0)
      const weakerEscape = lateralBase.lengthSq() > EPSILON ? lateralBase : strongerEscape.clone().negate()

      const strongerAdjustment = strongerEscape.clone().multiplyScalar(crownSeparation * corridorConflict * 0.18 * repulsionStrength)
      const weakerAdjustment = weakerEscape.clone().multiplyScalar(crownSeparation * corridorConflict * 0.38 * repulsionStrength)

      stronger.dir.add(strongerAdjustment).normalize()
      weaker.dir.add(weakerAdjustment).normalize()
      weaker.length *= THREE.MathUtils.clamp(1 - (corridorConflict * redundancyPenalty * 0.2), 0.62, 1)
      weaker.radius *= THREE.MathUtils.clamp(1 - (corridorConflict * redundancyPenalty * 0.08), 0.72, 1)
      weaker.dominance *= THREE.MathUtils.clamp(1 - (corridorConflict * parallelPenalty * 0.12), 0.7, 1)
    }
  }

  return roots.filter((root) => root.active && root.length > 0.15 && root.radius > 0.01)
}

export const generateTreeData = (params, options = {}) => {
  const random = mulberry32(params.seed)
  const skeleton = []
  const nodes = []
  const anchorSegments = []
  const committedSegments = []
  const leaderCorridors = []
  const goldenAngle = 137.508 * (Math.PI / 180)
  const leafPlacementStrategy = options.leafPlacementStrategy
  const growthStrategy = options.growthStrategy
  const broadleafMode = options.mode === 'broadleaf'
  const coniferMode = options.mode === 'conifer'

  const isAnchor = (depth, t) => leafPlacementStrategy?.isAnchor({ params, depth, t })

  const grow = (
    startPos,
    startDir,
    length,
    radius,
    depth,
    parentBranchIdx = -1,
    parentBoneId = -1,
    axisContext = { isLeader: false, leaderClass: 'branch', parentAxisId: -1, axisId: null },
  ) => {
    if (depth > params.recursion || radius < 0.005 || length < 0.05) return

    const level = params.levels[Math.min(depth, params.levels.length - 1)]
    const segments = Math.max(3, level.segments)
    let currentPos = startPos.clone()
    let currentDir = startDir.clone().normalize()
    const nodePoints = []

    const initialBoneId = skeleton.length
    const axisId = axisContext.axisId ?? initialBoneId
    const rootBone = {
      id: initialBoneId,
      parentId: parentBoneId,
      pos: currentPos.clone(),
      dir: currentDir.clone(),
      radius,
      depth,
      length: 0,
      isTwig: false,
      isLeader: axisContext.isLeader,
      leaderClass: axisContext.leaderClass,
    }
    skeleton.push(rootBone)
    nodePoints.push({ ...rootBone, t: 0, boneId: initialBoneId })

    let previousBoneId = initialBoneId
    let terminatedEarly = false

    for (let index = 1; index <= segments; index += 1) {
      const t = index / segments
      const tropVec = UP.clone().multiplyScalar(params.tropismUp * 0.1)
      const gravVec = UP.clone().multiplyScalar(-params.gravity * 0.15 * t)
      const noise = new THREE.Vector3(
        (random() - 0.5) * level.curve,
        (random() - 0.5) * level.curve,
        (random() - 0.5) * level.curve,
      ).multiplyScalar(0.2)

      const naturalDir = currentDir.clone().add(tropVec).add(gravVec).add(noise).normalize()
      const stepLengthBase = length / segments
      const candidatePos = currentPos.clone().add(naturalDir.clone().multiplyScalar(stepLengthBase))

      const awareness = computeBranchAwareness({
        params,
        candidatePos,
        currentDir: naturalDir,
        currentPos,
        axisId,
        isLeader: axisContext.isLeader,
        leaderClass: axisContext.leaderClass,
        parentAxisId: axisContext.parentAxisId,
        committedSegments,
        leaderCorridors,
        random,
      })

      if (awareness.terminate && index > Math.ceil(segments * 0.45)) {
        terminatedEarly = true
        break
      }

      currentDir.copy(awareness.direction)
      const stepLength = stepLengthBase * awareness.stepScale
      const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(stepLength))
      const currentRadius = radius * (1 - (t * (1 - params.taper)))

      const newBoneId = skeleton.length
      const bone = {
        id: newBoneId,
        parentId: previousBoneId,
        pos: nextPos.clone(),
        dir: currentDir.clone(),
        radius: currentRadius,
        depth,
        length: stepLength,
        isTwig: false,
        isLeader: axisContext.isLeader,
        leaderClass: axisContext.leaderClass,
      }
      skeleton.push(bone)
      nodePoints.push({ ...bone, t, boneId: newBoneId })
      committedSegments.push(createCommittedSegment({
        start: currentPos,
        end: nextPos,
        dir: currentDir,
        radius: currentRadius,
        depth,
        axisId,
        isLeader: axisContext.isLeader,
        leaderClass: axisContext.leaderClass,
        parentAxisId: axisContext.parentAxisId,
      }))

      if (isAnchor?.(depth, t)) {
        anchorSegments.push(bone)
      }

      currentPos.copy(nextPos)
      previousBoneId = newBoneId
    }

    const nodeIdx = nodes.length
    nodes.push({
      points: nodePoints,
      depth,
      parentIdx: parentBranchIdx,
      isLeader: axisContext.isLeader,
      leaderClass: axisContext.leaderClass,
    })

    if (depth >= params.recursion || terminatedEarly) return

    if (depth === 0 && !axisContext.isLeader) {
      const maxLeaders = Math.max(0, Math.min(params.leaderCount ?? 0, 6))
      const startMin = THREE.MathUtils.clamp(params.leaderStartMin ?? 0.2, 0, 1)
      const startMax = THREE.MathUtils.clamp(Math.max(startMin, params.leaderStartMax ?? 0.5), 0, 1)
      const leaderChance = THREE.MathUtils.clamp(params.leaderSplitChance ?? 0.2, 0, 1)
      const proposedLeaderRoots = []

      for (let leaderIndex = 0; leaderIndex < maxLeaders; leaderIndex += 1) {
        if (random() > leaderChance) continue
        const t = startMin + ((startMax - startMin) * ((leaderIndex + 0.5) / Math.max(maxLeaders, 1)))
        const spawnIdx = THREE.MathUtils.clamp(Math.floor(t * Math.max(nodePoints.length - 1, 1)), 1, Math.max(nodePoints.length - 1, 1))
        const spawnPoint = nodePoints[spawnIdx]
        const dominance = params.leaderDominance ?? 0.9
        const lengthBias = params.leaderLengthBias ?? 1
        const thicknessRetention = params.leaderThicknessRetention ?? 0.8
        const inheritance = params.leaderInheritance ?? 0.7
        const upwardBias = params.leaderUpwardBias ?? 1
        const leaderClass = leaderIndex === 0 ? 'primary' : 'co-leader'
        const radialDir = new THREE.Vector3().crossVectors(spawnPoint.dir, UP).normalize()
        if (radialDir.lengthSq() < EPSILON) radialDir.set(1, 0, 0)
        radialDir.applyAxisAngle(spawnPoint.dir, ((leaderIndex / Math.max(maxLeaders, 1)) * Math.PI * 2) + ((random() - 0.5) * 0.65))

        const leaderDir = spawnPoint.dir.clone()
          .lerp(radialDir, (1 - inheritance) * 0.65)
          .add(new THREE.Vector3(0, upwardBias * 0.45, 0))
          .normalize()

        const leaderLength = (params.height * 0.6 * lengthBias * dominance) * (0.75 + (random() * 0.25)) * (1 - (t * 0.35))
        const leaderRadius = spawnPoint.radius * thicknessRetention * (0.9 + (random() * 0.15))
        proposedLeaderRoots.push({
          active: true,
          pos: spawnPoint.pos.clone(),
          dir: leaderDir,
          length: leaderLength,
          radius: leaderRadius,
          boneId: spawnPoint.boneId,
          axisId: `leader-${leaderIndex}-${spawnPoint.boneId}`,
          leaderClass,
          dominance,
        })
      }

      resolveLeaderRoots(proposedLeaderRoots, params).forEach((leaderRoot) => {
        leaderCorridors.push({
          axisId: leaderRoot.axisId,
          active: true,
          width: (params.leaderCorridorWidth ?? 1.2) * leaderRoot.radius * 3.2,
          end: leaderRoot.pos.clone().add(leaderRoot.dir.clone().multiplyScalar(leaderRoot.length * (params.leaderProjectionLength ?? 1))),
        })

        grow(
          leaderRoot.pos,
          leaderRoot.dir,
          leaderRoot.length,
          leaderRoot.radius,
          1,
          nodeIdx,
          leaderRoot.boneId,
          { isLeader: true, leaderClass: leaderRoot.leaderClass, parentAxisId: axisId, axisId: leaderRoot.axisId },
        )
      })
    }

    const childCount = growthStrategy?.getChildCount(level.branchCount, random) ?? Math.max(0, Math.floor(level.branchCount + (random() * 0.5)))
    let currentSpin = random() * Math.PI * 2

    if (coniferMode || params.name === 'Pine' || params.leafStyle === 'needle') {
      const minT = depth === 0 ? 0.1 : 0.05
      for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
        const t = minT + ((1 - minT) * ((childIndex + 0.5) / childCount))
        const spawnIdx = Math.min(Math.floor(t * Math.max(nodePoints.length - 1, 1)), Math.max(nodePoints.length - 1, 1))
        const spawnPoint = nodePoints[spawnIdx]
        const coneTaper = 1 - (depth === 0 ? t : Math.pow(t, 0.4))
        const childLengthBase = depth === 0 ? params.height * level.lengthScale : length * level.lengthScale
        const childLength = childLengthBase * coneTaper * (0.8 + (random() * 0.4))
        const childRadius = spawnPoint.radius * level.radiusScale * (0.8 + (random() * 0.3))
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
          const side = new THREE.Vector3().crossVectors(UP, spawnPoint.dir).normalize()
          if (side.lengthSq() < EPSILON) side.set(1, 0, 0)
          if (childIndex % 2 === 0) side.negate()
          spawnDir.lerp(side, level.branchAngle * 0.9).normalize()
          spawnDir.y += 0.2
          spawnDir.normalize()
        }

        grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId, {
          isLeader: false,
          leaderClass: 'branch',
          parentAxisId: axisId,
        })
      }
    } else {
      for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
        const minT = depth === 0 ? 0.2 : 0.1
        const t = minT + ((1 - minT) * ((childIndex + 0.5) / childCount))
        const spawnIdx = Math.min(Math.floor(t * Math.max(nodePoints.length - 1, 1)), Math.max(nodePoints.length - 1, 1))
        const spawnPoint = nodePoints[spawnIdx]
        const ageFactor = 1 - t
        const energyRatio = broadleafMode
          ? THREE.MathUtils.lerp(0.3 + (0.7 * ageFactor), 0.4, level.apicalControl ?? 0.5)
          : THREE.MathUtils.lerp(0.5 + (0.5 * ageFactor), 0.4, level.apicalControl ?? 0.5)
        const childLength = (depth === 0 ? params.height * level.lengthScale : length * level.lengthScale) * energyRatio * (0.8 + (random() * 0.4))
        const childRadius = spawnPoint.radius * level.radiusScale * (0.8 + (random() * 0.3))
        if (childLength <= 0.1 || childRadius <= 0.005) continue

        const spawnDir = spawnPoint.dir.clone()
        let axis = new THREE.Vector3(0, 1, 0).cross(spawnDir).normalize()
        if (axis.lengthSq() < 0.1) axis.set(1, 0, 0)
        spawnDir.applyAxisAngle(axis, level.branchAngle * (1 - (0.3 * t)) + ((random() - 0.5) * 0.2))
        spawnDir.applyAxisAngle(spawnPoint.dir, currentSpin)
        currentSpin += goldenAngle + ((random() - 0.5) * 0.2)
        grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId, {
          isLeader: false,
          leaderClass: 'branch',
          parentAxisId: axisId,
        })
      }
    }
  }

  grow(new THREE.Vector3(0, 1.25, 0), new THREE.Vector3(0, 1, 0), params.height, params.radius, 0, -1, -1, {
    isLeader: false,
    leaderClass: 'primary',
    parentAxisId: -1,
  })

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
        const side = new THREE.Vector3().crossVectors(UP, anchorBone.dir).normalize()
        if (side.lengthSq() < 0.1) side.set(1, 0, 0)
        if (index % 2 === 0) side.negate()
        currentDir = anchorBone.dir.clone().lerp(side, 0.4 + (random() * 0.4)).normalize()
      } else {
        const spreadAxis = new THREE.Vector3(0, 1, 0).cross(anchorBone.dir).normalize()
        if (spreadAxis.lengthSq() < 0.1) spreadAxis.set(1, 0, 0)
        currentDir = anchorBone.dir.clone().applyAxisAngle(spreadAxis, (random() - 0.1) * 1.5).applyAxisAngle(anchorBone.dir, random() * Math.PI * 2).normalize()
      }

      let parentBoneId = anchorBone.id
      const totalTwigLen = (params.twigLength ?? 1) * anchorBone.radius * 6
      const stepLen = totalTwigLen / 3
      const twigPath = []

      for (let twigIndex = 1; twigIndex <= 3; twigIndex += 1) {
        const t = twigIndex / 3
        currentDir
          .add(UP.clone().multiplyScalar((params.twigPhototropism ?? 0.8) * 0.5))
          .add(UP.clone().multiplyScalar(-(params.twigGravity ?? 0.2) * 0.5))
          .normalize()
        const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(stepLen))
        const newBoneId = skeleton.length
        const bone = {
          id: newBoneId,
          parentId: parentBoneId,
          pos: nextPos.clone(),
          dir: currentDir.clone(),
          radius: anchorBone.radius * 0.1 * (1 - t),
          depth: anchorBone.depth + 1,
          length: stepLen,
          isTwig: true,
          t,
        }
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
        pitch = 0.2 + (random() * 0.3)
      } else if (anchor.type.startsWith('opposite')) {
        angle = (anchor.type === 'opposite1' ? 0 : Math.PI) + ((random() - 0.5) * 0.3)
        pitch = 0.2 + (random() * 0.3)
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
