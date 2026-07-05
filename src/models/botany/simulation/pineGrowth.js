import { mulberry32 } from '../generation/noise.js'

const EPSILON = 1e-6

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const lerp = (start, end, amount) => start + ((end - start) * amount)

const vec = (x = 0, y = 0, z = 0) => ({ x, y, z })
const add = (left, right) => vec(left.x + right.x, left.y + right.y, left.z + right.z)
const sub = (left, right) => vec(left.x - right.x, left.y - right.y, left.z - right.z)
const scale = (value, amount) => vec(value.x * amount, value.y * amount, value.z * amount)
const length = (value) => Math.sqrt((value.x ** 2) + (value.y ** 2) + (value.z ** 2))
const normalize = (value) => {
  const magnitude = length(value)
  if (magnitude < EPSILON) return vec(0, 1, 0)
  return scale(value, 1 / magnitude)
}
const cross = (left, right) => vec(
  (left.y * right.z) - (left.z * right.y),
  (left.z * right.x) - (left.x * right.z),
  (left.x * right.y) - (left.y * right.x),
)
const distance = (left, right) => length(sub(left, right))

const rotateAroundAxis = (vector, axis, angle) => {
  const unitAxis = normalize(axis)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dot = (vector.x * unitAxis.x) + (vector.y * unitAxis.y) + (vector.z * unitAxis.z)
  const crossValue = cross(unitAxis, vector)

  return vec(
    (vector.x * cos) + (crossValue.x * sin) + (unitAxis.x * dot * (1 - cos)),
    (vector.y * cos) + (crossValue.y * sin) + (unitAxis.y * dot * (1 - cos)),
    (vector.z * cos) + (crossValue.z * sin) + (unitAxis.z * dot * (1 - cos)),
  )
}

const hashSeed = (...parts) => parts.reduce((hash, part, index) => {
  const value = Number(part) || 0
  return (hash ^ Math.imul((value + 1 + (index * 31)), 2654435761)) >>> 0
}, 2166136261) >>> 0

const createDeterministicRandom = (...parts) => mulberry32(hashSeed(...parts))

const getProgressYears = (state) => state.absoluteTick / state.ticksPerYear

const getCurrentYear = (state) => (
  state.absoluteTick >= state.totalTicks
    ? state.years
    : Math.min(state.years, Math.floor(state.absoluteTick / state.ticksPerYear) + 1)
)

const getCurrentTickInYear = (state) => (
  state.absoluteTick >= state.totalTicks
    ? state.ticksPerYear
    : (state.absoluteTick % state.ticksPerYear)
)

const getVisibleGrowthProgress = (state, slot) => clamp(getProgressYears(state) - slot, 0, 1)

const buildSeedlingRoot = (params) => ({
  id: 0,
  parentId: null,
  depth: 0,
  order: 0,
  birthYear: -1,
  radiusStartYear: -1,
  start: vec(0, 0, 0),
  end: vec(0, 0.2, 0),
  direction: vec(0, 1, 0),
  previousRadius: Math.max(0.05, params.radius * 0.55),
  radius: Math.max(0.06, params.radius * 0.72),
  vigor: 1,
  foliageWeight: 0,
  isLeader: true,
  branchType: 'root-base',
})

const getChildSegments = (state, segmentId) => state.segments.filter((segment) => segment.parentId === segmentId)

const getEndpointCrowding = (state, position, ignoreSegmentId, radius) => {
  const samples = state.segments.filter((segment) => segment.id !== ignoreSegmentId)
  if (!samples.length || radius <= 0) return 0

  let crowding = 0
  samples.forEach((segment) => {
    const proximity = distance(position, segment.end)
    if (proximity > radius) return
    crowding += 1 - (proximity / radius)
  })

  return crowding
}

const getHeightFactor = (state, tip, params) => {
  const currentHeight = Math.max(...state.segments.map((segment) => segment.end.y), tip.end.y)
  return clamp(1 - (currentHeight / Math.max(params.height, 1)), 0.18, 1)
}

const computeTipVigor = (state, tip, params) => {
  const crowding = getEndpointCrowding(state, tip.end, tip.id, Math.max(4, params.branchAwarenessRadius ?? 6))
  const heightFactor = getHeightFactor(state, tip, params)
  const agePenalty = clamp((state.builtYearSlots - tip.birthYear) * 0.06, 0, 0.55)
  const orderPenalty = tip.order * 0.08
  const lowerBranchPenalty = tip.order > 0 && tip.end.y < (params.height * 0.22) ? 0.22 : 0
  const upwardBonus = clamp(tip.direction.y, 0, 1) * 0.18
  return clamp((1.02 - orderPenalty - agePenalty - lowerBranchPenalty - (crowding * 0.2) + upwardBonus) * heightFactor, 0, 1.3)
}

const createSegment = ({
  state,
  parent,
  end,
  direction,
  lengthValue,
  radius,
  vigor,
  order,
  branchType,
  isLeader,
  birthYear,
}) => ({
  id: state.nextSegmentId++,
  parentId: parent.id,
  depth: parent.depth + 1,
  order,
  birthYear,
  radiusStartYear: birthYear,
  start: { ...parent.end },
  end,
  direction,
  length: lengthValue,
  previousRadius: Math.max(radius * 0.68, 0.01),
  radius,
  vigor,
  foliageWeight: Math.max(0.2, lengthValue * (branchType === 'leader' ? 0.9 : 1.15) * (0.8 + vigor)),
  isLeader,
  branchType,
})

const createLeaderContinuation = (state, parent, birthYear, params) => {
  const random = createDeterministicRandom(state.seed, birthYear, parent.id, 1)
  const vigor = computeTipVigor(state, parent, params)
  if (vigor < 0.12) return null

  const maturity = clamp(birthYear / Math.max(state.years - 1, 1), 0, 1)
  const baseLength = params.height * lerp(0.11, 0.038, maturity)
  const upwardBias = clamp(params.leaderUpwardBias ?? 1.5, 0.2, 2)
  const outward = normalize(vec(parent.end.x, 0, parent.end.z))
  const steering = normalize(add(
    add(scale(parent.direction, 0.75), scale(vec(0, 1, 0), 0.8 + (upwardBias * 0.25))),
    scale(outward, 0.14 * random()),
  ))
  const lengthValue = baseLength * (0.72 + (vigor * 0.55)) * (0.9 + (random() * 0.18))
  const end = add(parent.end, scale(steering, lengthValue))

  return createSegment({
    state,
    parent,
    end,
    direction: steering,
    lengthValue,
    radius: Math.max(parent.radius * lerp(0.88, 0.76, maturity), 0.012),
    vigor,
    order: 0,
    branchType: 'leader',
    isLeader: true,
    birthYear,
  })
}

const createLateralBranches = (state, parent, birthYear, params) => {
  const random = createDeterministicRandom(state.seed, birthYear, parent.id, 7)
  const vigor = computeTipVigor(state, parent, params)
  const shouldContinue = vigor >= 0.2 && !(parent.order > 0 && vigor < 0.34 && parent.end.y < (params.height * 0.35))
  if (!shouldContinue) return []

  const maturity = clamp(birthYear / Math.max(state.years - 1, 1), 0, 1)
  const branchLevel = params.levels[Math.min(parent.depth, params.levels.length - 1)] ?? params.levels[params.levels.length - 1]
  const baseCount = parent.order === 0
    ? clamp(Math.round(2 + (vigor * 2.4)), 2, 5)
    : clamp(Math.round(vigor * 2.2), 0, 3)
  const branchCount = clamp(baseCount + Math.round((random() - 0.5) * 1.4), 0, parent.order === 0 ? 5 : 3)
  if (branchCount <= 0) return []

  const axis = normalize(cross(parent.direction, vec(0, 1, 0)))
  const safeAxis = length(axis) < EPSILON ? vec(1, 0, 0) : axis
  const angleBase = branchLevel?.branchAngle ?? 1
  const results = []

  for (let index = 0; index < branchCount; index += 1) {
    const whorlAngle = ((Math.PI * 2) * index) / branchCount
    const radialDirection = rotateAroundAxis(safeAxis, parent.direction, whorlAngle)
    const conicDirection = rotateAroundAxis(parent.direction, cross(parent.direction, radialDirection), angleBase * lerp(0.65, 0.82, maturity))
    const lifted = normalize(add(scale(conicDirection, 0.9), scale(vec(0, 1, 0), 0.24 + (random() * 0.12))))
    const lengthScale = branchLevel?.lengthScale ?? 0.75
    const lengthValue = params.height * lengthScale * lerp(0.12, 0.03, maturity) * (0.55 + (vigor * 0.5)) * (0.8 + (random() * 0.25))
    if (lengthValue < 0.08) continue

    const end = add(parent.end, scale(lifted, lengthValue))
    results.push(createSegment({
      state,
      parent,
      end,
      direction: lifted,
      lengthValue,
      radius: Math.max(parent.radius * (branchLevel?.radiusScale ?? 0.7) * (0.72 + (random() * 0.18)), 0.01),
      vigor: clamp(vigor * 0.88, 0.15, 1),
      order: parent.order + 1,
      branchType: 'lateral',
      isLeader: false,
      birthYear,
    }))
  }

  return results
}

const updateSegmentRadii = (state, params, birthYear) => {
  const supportCache = new Map()

  const accumulateSupport = (segmentId) => {
    if (supportCache.has(segmentId)) return supportCache.get(segmentId)
    const segment = state.segments.find((candidate) => candidate.id === segmentId)
    if (!segment) return 0
    const children = getChildSegments(state, segmentId)
    const childSupport = children.reduce((sum, child) => sum + accumulateSupport(child.id), 0)
    const support = Math.max(segment.foliageWeight, childSupport + (segment.foliageWeight * 0.35))
    supportCache.set(segmentId, support)
    return support
  }

  state.segments.forEach((segment) => {
    const support = accumulateSupport(segment.id)
    const depthPenalty = clamp(segment.order * 0.08, 0, 0.42)
    const targetRadius = Math.max(
      segment.branchType === 'root-base'
        ? params.radius * 0.55
        : segment.radius,
      Math.sqrt(support) * (segment.order === 0 ? 0.078 : 0.052) * (1 - depthPenalty),
      0.01,
    )
    segment.previousRadius = segment.radius
    segment.radius = Number(targetRadius.toFixed(4))
    segment.radiusStartYear = Math.max(segment.radiusStartYear, birthYear)
  })
}

export const applyAnnualGrowthCycle = (state, params, birthYear) => {
  const activeTips = state.segments.filter((segment) => {
    if (segment.branchType === 'root-base') return false
    return !state.segments.some((candidate) => candidate.parentId === segment.id)
  })

  const spawnedSegments = []
  activeTips.forEach((tip) => {
    const leader = createLeaderContinuation(state, tip, birthYear, params)
    if (leader) {
      spawnedSegments.push(leader)
    }

    const lateralBranches = createLateralBranches(state, tip, birthYear, params)
    spawnedSegments.push(...lateralBranches)
  })

  if (spawnedSegments.length > 0) {
    state.segments.push(...spawnedSegments)
  }

  updateSegmentRadii(state, params, birthYear)
  state.builtYearSlots = birthYear
  state.lastAnnualGrowthTick = state.absoluteTick
  return state
}

export const initializePineGrowth = (config) => {
  const params = config.params
  const years = Math.max(1, Math.floor(params.simulationYears ?? 20))
  const ticksPerYear = Math.max(1, Math.floor(params.ticksPerYear ?? 12))

  const state = {
    seed: params.seed ?? 108,
    years,
    ticksPerYear,
    totalTicks: years * ticksPerYear,
    absoluteTick: 0,
    builtYearSlots: 0,
    nextSegmentId: 1,
    lastAnnualGrowthTick: 0,
    segments: [buildSeedlingRoot(params)],
  }

  applyAnnualGrowthCycle(state, params, 0)
  return state
}

export const advancePineGrowthTick = (state, config) => {
  if (state.absoluteTick >= state.totalTicks) {
    return state
  }

  state.absoluteTick += 1
  const targetYearSlot = Math.min(state.years - 1, Math.floor(state.absoluteTick / state.ticksPerYear))
  while (state.builtYearSlots < targetYearSlot) {
    applyAnnualGrowthCycle(state, config.params, state.builtYearSlots + 1)
  }
  return state
}

export const resetPineGrowth = (config) => initializePineGrowth(config)

export const seekPineGrowth = (checkpointState, config, targetTick) => {
  const next = structuredClone(checkpointState)
  next.absoluteTick = checkpointState.absoluteTick
  while (next.absoluteTick < targetTick) {
    advancePineGrowthTick(next, config)
  }
  return next
}

export const createPineGrowthSnapshot = (state) => ({
  years: state.years,
  ticksPerYear: state.ticksPerYear,
  totalTicks: state.totalTicks,
  absoluteTick: state.absoluteTick,
  currentYear: getCurrentYear(state),
  currentTickInYear: getCurrentTickInYear(state),
  progressYears: getProgressYears(state),
  completed: state.absoluteTick >= state.totalTicks,
})

export const getVisibleSegments = (state) => state.segments.map((segment) => {
  const progress = segment.birthYear < 0 ? 1 : getVisibleGrowthProgress(state, segment.birthYear)
  const radiusProgress = segment.radiusStartYear < 0 ? 1 : getVisibleGrowthProgress(state, segment.radiusStartYear)

  return {
    ...segment,
    visibleEnd: add(segment.start, scale(sub(segment.end, segment.start), progress)),
    visibleRadius: lerp(segment.previousRadius, segment.radius, radiusProgress),
    visibleProgress: progress,
  }
}).filter((segment) => segment.branchType === 'root-base' || segment.visibleProgress > 0)

