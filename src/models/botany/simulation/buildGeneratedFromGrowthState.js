import * as THREE from 'three'
import { assignVisualFeatures } from '../pipeline/assignVisualFeatures.js'
import { buildRenderArtifacts } from '../pipeline/buildRenderArtifacts.js'
import { buildGeneratedTreeAsset } from '../lod/buildTreeAsset.js'
import { createSpecimenRecipe } from '../pipeline/createSpecimenRecipe.js'
import { deriveGrowthContext } from '../pipeline/deriveGrowthContext.js'
import { buildStructureGraphFromTreeData } from '../pipeline/buildStructureGraph.js'
import { getSpecimenOrbitTarget } from '../generation/camera.js'
import { createPineGrowthSnapshot, getVisibleSegments } from './pineGrowth.js'

const normalize = (vector) => {
  const next = vector.clone()
  if (next.lengthSq() < 1e-8) {
    return new THREE.Vector3(0, 1, 0)
  }
  return next.normalize()
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const createNeedleInstances = (segments, params, simulationSnapshot) => {
  const visibleBranches = segments.filter((segment) => segment.branchType !== 'root-base')
  if (!visibleBranches.length || params.leafCount <= 0) return []

  const weighted = visibleBranches.map((segment) => ({
    segment,
    weight: Math.max(0.0001, segment.visibleRadius * (segment.order === 0 ? 0.2 : 1.1) * (0.5 + segment.visibleProgress)),
  }))
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  const targetLeafCount = Math.min(params.leafCount, 8000)
  const leafInstances = []

  weighted.forEach(({ segment, weight }) => {
    const leafBudget = clamp(Math.round((weight / totalWeight) * targetLeafCount), 1, 220)
    const baseDirection = normalize(new THREE.Vector3(segment.direction.x, segment.direction.y, segment.direction.z))
    const sideAxis = normalize(new THREE.Vector3().crossVectors(baseDirection, new THREE.Vector3(0, 1, 0)))
    const fallbackSide = sideAxis.lengthSq() < 1e-5 ? new THREE.Vector3(1, 0, 0) : sideAxis

    for (let index = 0; index < leafBudget; index += 1) {
      const t = (index + 1) / (leafBudget + 1)
      const spin = ((index % 6) / 6) * Math.PI * 2
      const radius = segment.visibleRadius * 1.8
      const anchor = new THREE.Vector3(
        segment.start.x + ((segment.visibleEnd.x - segment.start.x) * t),
        segment.start.y + ((segment.visibleEnd.y - segment.start.y) * t),
        segment.start.z + ((segment.visibleEnd.z - segment.start.z) * t),
      )
      const spiralOffset = fallbackSide.clone().applyAxisAngle(baseDirection, spin).multiplyScalar(radius)
      const position = anchor.clone().add(spiralOffset)
      const needleDirection = normalize(baseDirection.clone().lerp(spiralOffset.clone().normalize(), 0.42))

      leafInstances.push({
        pos: position,
        dir: needleDirection,
        radius: segment.visibleRadius,
        angle: spin,
        pitch: 0.25 + (((simulationSnapshot.absoluteTick + index) % simulationSnapshot.ticksPerYear) / (simulationSnapshot.ticksPerYear * 3)),
        roll: spin * 0.5,
        boneId: segment.id,
      })
    }
  })

  return leafInstances
}

export const buildTreeDataFromGrowthState = (state, params) => {
  const visibleSegments = getVisibleSegments(state)
  const skeleton = []
  const nodes = []
  const rootBase = visibleSegments.find((segment) => segment.branchType === 'root-base')
  const rootRadius = rootBase?.visibleRadius ?? Math.max(0.08, params.radius * 0.55)

  const rootBone = {
    id: 0,
    parentId: -1,
    pos: new THREE.Vector3(0, rootRadius, 0),
    dir: new THREE.Vector3(0, 1, 0),
    radius: rootRadius,
    depth: 0,
    length: 0,
    isTwig: false,
    isLeader: true,
    leaderClass: 'primary',
  }
  skeleton.push(rootBone)

  const endBoneIds = new Map()

  visibleSegments
    .filter((segment) => segment.branchType !== 'root-base')
    .sort((left, right) => left.id - right.id)
    .forEach((segment) => {
      const startBone = segment.parentId == null
        ? rootBone
        : endBoneIds.get(segment.parentId) ?? rootBone
      const endBone = {
        id: skeleton.length,
        parentId: startBone.id,
        pos: new THREE.Vector3(segment.visibleEnd.x, segment.visibleEnd.y + rootRadius, segment.visibleEnd.z),
        dir: new THREE.Vector3(segment.direction.x, segment.direction.y, segment.direction.z),
        radius: Math.max(segment.visibleRadius, 0.008),
        depth: segment.depth,
        length: Math.sqrt(
          ((segment.visibleEnd.x - segment.start.x) ** 2)
          + ((segment.visibleEnd.y - segment.start.y) ** 2)
          + ((segment.visibleEnd.z - segment.start.z) ** 2),
        ),
        isTwig: segment.order > 2,
        isLeader: segment.isLeader,
        leaderClass: segment.isLeader ? (segment.order === 0 ? 'primary' : 'co-leader') : 'branch',
      }
      skeleton.push(endBone)
      endBoneIds.set(segment.id, endBone)

      const startPoint = {
        ...startBone,
        pos: startBone.pos.clone(),
        dir: startBone.dir.clone(),
        t: 0,
        boneId: startBone.id,
      }
      const endPoint = {
        ...endBone,
        pos: endBone.pos.clone(),
        dir: endBone.dir.clone(),
        t: 1,
        boneId: endBone.id,
      }

      nodes.push({
        points: [startPoint, endPoint],
        depth: segment.depth,
        parentIdx: -1,
        isLeader: segment.isLeader,
        leaderClass: endBone.leaderClass,
      })
    })

  const simulationSnapshot = createPineGrowthSnapshot(state)
  const leafInstances = createNeedleInstances(visibleSegments, params, simulationSnapshot)

  return {
    nodes,
    skeleton,
    leafInstances,
    rootAnchor: new THREE.Vector3(0, 0, 0),
    rootRadius,
  }
}

const summarizeGrowthState = (specimen, treeData) => {
  const rootAnchor = treeData.rootAnchor ?? treeData.skeleton[0]?.pos ?? new THREE.Vector3(0, 0, 0)
  const tipHeight = treeData.skeleton.reduce((maxHeight, bone) => Math.max(maxHeight, bone.pos.y), 0)
  const estimatedHeight = Number((tipHeight - rootAnchor.y).toFixed(3))
  const orbitTarget = getSpecimenOrbitTarget(specimen.params, treeData, estimatedHeight)

  return {
    presetName: specimen.params.name,
    recursion: specimen.params.recursion,
    skeletonCount: treeData.skeleton.length,
    branchNodeCount: treeData.nodes.length,
    leafInstanceCount: treeData.leafInstances.length,
    estimatedHeight,
    boneCount: treeData.skeleton.length,
    rootAnchor: {
      x: Number(rootAnchor.x.toFixed(3)),
      y: Number(rootAnchor.y.toFixed(3)),
      z: Number(rootAnchor.z.toFixed(3)),
    },
    rootRadius: Number((treeData.rootRadius ?? 0).toFixed(3)),
    placementAnchor: {
      x: 0,
      y: Number((treeData.rootRadius ?? 0).toFixed(3)),
      z: 0,
    },
    landedAnchor: null,
    orbitTarget: {
      x: Number(orbitTarget.x.toFixed(3)),
      y: Number(orbitTarget.y.toFixed(3)),
      z: Number(orbitTarget.z.toFixed(3)),
    },
    orbitTargetSource: 'simulation-root',
  }
}

export const buildGeneratedFromGrowthState = (specimen, state) => {
  const recipe = createSpecimenRecipe(specimen, { mode: 'conifer' })
  const growthContext = deriveGrowthContext(recipe)
  const treeData = buildTreeDataFromGrowthState(state, recipe.params)
  const structureGraph = buildStructureGraphFromTreeData(recipe, treeData, `pine-sim:${state.absoluteTick}`)
  const visualFeatures = assignVisualFeatures({ recipe, growthContext, structureGraph })
  const renderArtifacts = buildRenderArtifacts({ recipe, structureGraph, visualFeatures })
  const stats = summarizeGrowthState(specimen, treeData)
  const treeAsset = buildGeneratedTreeAsset({
    specimen,
    structureGraph,
    visualFeatures,
    stats,
  })

  return {
    specimen,
    validation: { valid: true, errors: [] },
    recipe,
    growthContext,
    structureGraph,
    visualFeatures,
    renderArtifacts,
    treeData,
    treeAsset,
    orbitTarget: stats.orbitTarget,
    stats,
    simulation: {
      ...createPineGrowthSnapshot(state),
    },
  }
}

