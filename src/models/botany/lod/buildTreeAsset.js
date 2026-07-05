import * as THREE from 'three'
import { getExportProfile } from '../export/exportProfiles.js'
import { getImpostorBakeFrames, resolveImpostorFrameLayout } from '../impostors/impostorFrames.js'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const toPlainVector = (vector) => ({
  x: Number(vector.x.toFixed(3)),
  y: Number(vector.y.toFixed(3)),
  z: Number(vector.z.toFixed(3)),
})

const toPlainSize = (width, height) => ({
  width: Number(width.toFixed(3)),
  height: Number(height.toFixed(3)),
})

const computeBounds = (treeData) => {
  const box = new THREE.Box3()
  treeData.skeleton.forEach((bone) => box.expandByPoint(bone.pos))
  treeData.leafInstances.forEach((leaf) => box.expandByPoint(leaf.pos))
  if (treeData.rootAnchor) {
    box.expandByPoint(treeData.rootAnchor)
  }

  if (box.isEmpty()) {
    box.min.set(-1, 0, -1)
    box.max.set(1, 2, 1)
  }

  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  return {
    min: toPlainVector(box.min),
    max: toPlainVector(box.max),
    size: toPlainVector(size),
    center: toPlainVector(center),
  }
}

const buildLeafClusters = (treeData, leafSize, {
  idPrefix,
  gridSize,
  cardCount,
  sizeScale,
}) => {
  const grid = new Map()

  treeData.leafInstances.forEach((leaf) => {
    const key = [
      Math.round(leaf.pos.x / gridSize),
      Math.round(leaf.pos.y / gridSize),
      Math.round(leaf.pos.z / gridSize),
    ].join(':')
    const bucket = grid.get(key) ?? []
    bucket.push(leaf)
    grid.set(key, bucket)
  })

  return Array.from(grid.entries())
    .filter(([, leaves]) => leaves.length > 0)
    .map(([key, leaves], index) => {
      const center = leaves.reduce((sum, leaf) => sum.add(leaf.pos), new THREE.Vector3()).multiplyScalar(1 / leaves.length)
      const averageDir = leaves.reduce((sum, leaf) => sum.add(leaf.dir), new THREE.Vector3(0, 0, 0))
      const baseDir = averageDir.lengthSq() > 0.0001 ? averageDir.normalize() : new THREE.Vector3(0, 1, 0)
      const horizontal = new THREE.Vector3(center.x, 0, center.z)
      if (horizontal.lengthSq() < 0.0001) horizontal.set(1, 0, 0)
      horizontal.normalize()

      let maxDistance = leafSize
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      leaves.forEach((leaf) => {
        maxDistance = Math.max(maxDistance, center.distanceTo(leaf.pos))
        minY = Math.min(minY, leaf.pos.y)
        maxY = Math.max(maxY, leaf.pos.y)
      })

      const clusterHeight = Math.max((maxY - minY) + leafSize * 2.5, leafSize * 3)
      const clusterWidth = Math.max((maxDistance * 2.2) + (leafSize * 1.8), leafSize * 2.2)
      const cards = []

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
        const yaw = (Math.PI / Math.max(cardCount, 1)) * cardIndex
        const direction = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).normalize()
        cards.push({
          id: `${idPrefix}:card:${index}:${cardIndex}`,
          position: toPlainVector(center),
          direction: toPlainVector(direction),
          size: toPlainSize(clusterWidth * sizeScale, clusterHeight * sizeScale),
          leafCount: leaves.length,
          roll: Number(yaw.toFixed(3)),
        })
      }

      return {
        id: `${idPrefix}:cluster:${index}`,
        cellKey: key,
        position: toPlainVector(center),
        direction: toPlainVector(horizontal),
        size: toPlainSize(clusterWidth, clusterHeight),
        leafCount: leaves.length,
        cards,
      }
    })
}

const buildImpostorDescriptor = (bounds, estimatedHeight, pivot, orbitTarget) => {
  const frameLayout = resolveImpostorFrameLayout({
    atlas: {
      columns: 8,
      rows: 2,
      frameWidth: 256,
      frameHeight: 256,
      elevationBands: [-12, 24],
    },
  })
  const pivotOffset = orbitTarget
    ? {
        x: Number((orbitTarget.x - pivot.x).toFixed(3)),
        y: Number((orbitTarget.y - pivot.y).toFixed(3)),
        z: Number((orbitTarget.z - pivot.z).toFixed(3)),
      }
    : {
        x: Number((bounds.center.x - pivot.x).toFixed(3)),
        y: Number((estimatedHeight * 0.5).toFixed(3)),
        z: Number((bounds.center.z - pivot.z).toFixed(3)),
      }

  return {
    representationType: 'impostor-billboard',
    previewMode: 'single-billboard',
    viewCount: 16,
    azimuthSteps: frameLayout.azimuthSteps,
    elevationBands: frameLayout.elevationBands,
    frameLayout,
    frameMapping: getImpostorBakeFrames(frameLayout),
    atlas: {
      columns: frameLayout.columns,
      rows: frameLayout.rows,
      frameWidth: frameLayout.frameWidth,
      frameHeight: frameLayout.frameHeight,
      elevationBands: frameLayout.elevationBands,
    },
    pivotOffset,
    billboardSize: {
      width: Number(Math.max(bounds.size.x, bounds.size.z, estimatedHeight * 0.45).toFixed(3)),
      height: Number(Math.max(bounds.size.y, estimatedHeight).toFixed(3)),
    },
    textures: {
      albedoAlpha: 'TreeName_Impostor_AlbedoAlpha.png',
      normal: 'TreeName_Impostor_Normal.png',
      maskDepth: 'TreeName_Impostor_MaskDepth.png',
    },
  }
}

const buildLodBudgets = ({ branches, cards, textureBudget, silhouetteTolerance }) => ({
  branchCount: branches,
  cardCount: cards,
  textureBudget,
  silhouetteTolerance,
})

export const buildGeneratedTreeAsset = ({
  specimen,
  structureGraph,
  visualFeatures,
  stats,
  exportProfileId,
}) => {
  const exportProfile = getExportProfile(exportProfileId)
  const bounds = computeBounds(structureGraph.treeData)
  const rootAnchor = structureGraph.treeData.rootAnchor ?? structureGraph.treeData.skeleton[0]?.pos ?? new THREE.Vector3(0, 0, 0)
  const rootRadius = structureGraph.treeData.rootRadius ?? structureGraph.treeData.skeleton[0]?.radius ?? 0
  const leafSize = visualFeatures.materialRecipe?.foliage?.leafSize ?? 0.45
  const skeletonCount = structureGraph.segmentGraph.length
  const estimatedHeight = stats?.estimatedHeight ?? bounds.size.y ?? 1

  const lod1Clusters = buildLeafClusters(structureGraph.treeData, leafSize, {
    idPrefix: 'lod1',
    gridSize: clamp(estimatedHeight * 0.05, leafSize * 2.5, leafSize * 7),
    cardCount: 3,
    sizeScale: 1.1,
  })

  const lod2Clusters = buildLeafClusters(structureGraph.treeData, leafSize, {
    idPrefix: 'lod2',
    gridSize: clamp(estimatedHeight * 0.09, leafSize * 4, leafSize * 12),
    cardCount: 2,
    sizeScale: 1.35,
  })

  const lods = [
    {
      level: 0,
      label: 'LOD0',
      representationType: 'hero-mesh',
      meshData: {
        radialSegments: 8,
        maxDepth: null,
        minRadius: 0,
        includeTwigs: true,
      },
      leafCards: [],
      impostor: null,
      leafClusterSet: {
        clusterCount: structureGraph.foliageAnchorSet.length,
        cards: [],
      },
      budgets: buildLodBudgets({
        branches: skeletonCount,
        cards: 0,
        textureBudget: 'hero',
        silhouetteTolerance: 'exact',
      }),
      previewStats: {
        leafInstanceCount: structureGraph.treeData.leafInstances.length,
        branchNodeCount: structureGraph.axisGraph.length,
      },
    },
    {
      level: 1,
      label: 'LOD1',
      representationType: 'clustered-leaf-cards',
      meshData: {
        radialSegments: 6,
        maxDepth: Math.max(2, Math.min(4, specimen.params.recursion ?? 3)),
        minRadius: 0.012,
        includeTwigs: false,
      },
      leafCards: lod1Clusters.flatMap((cluster) => cluster.cards),
      impostor: null,
      leafClusterSet: {
        clusterCount: lod1Clusters.length,
        cards: lod1Clusters.flatMap((cluster) => cluster.cards),
      },
      budgets: buildLodBudgets({
        branches: Math.round(skeletonCount * 0.6),
        cards: lod1Clusters.reduce((sum, cluster) => sum + cluster.cards.length, 0),
        textureBudget: 'leaf-card-atlas',
        silhouetteTolerance: 'medium',
      }),
      previewStats: {
        clusterCount: lod1Clusters.length,
        representativeLeafCount: lod1Clusters.reduce((sum, cluster) => sum + cluster.leafCount, 0),
      },
    },
    {
      level: 2,
      label: 'LOD2',
      representationType: 'canopy-summary-cards',
      meshData: {
        radialSegments: 4,
        maxDepth: Math.max(1, Math.min(3, (specimen.params.recursion ?? 3) - 1)),
        minRadius: 0.03,
        includeTwigs: false,
      },
      leafCards: lod2Clusters.flatMap((cluster) => cluster.cards),
      impostor: null,
      leafClusterSet: {
        clusterCount: lod2Clusters.length,
        cards: lod2Clusters.flatMap((cluster) => cluster.cards),
      },
      budgets: buildLodBudgets({
        branches: Math.round(skeletonCount * 0.28),
        cards: lod2Clusters.reduce((sum, cluster) => sum + cluster.cards.length, 0),
        textureBudget: 'shared-canopy-cards',
        silhouetteTolerance: 'broad',
      }),
      previewStats: {
        clusterCount: lod2Clusters.length,
        representativeLeafCount: lod2Clusters.reduce((sum, cluster) => sum + cluster.leafCount, 0),
      },
    },
    {
      level: 3,
      label: 'LOD3',
      representationType: 'impostor-billboard',
      meshData: {
        radialSegments: 3,
        maxDepth: 1,
        minRadius: 0.08,
        includeTwigs: false,
      },
      leafCards: [],
      impostor: buildImpostorDescriptor(
        bounds,
        estimatedHeight,
        rootAnchor,
        stats?.orbitTarget
          ? new THREE.Vector3(stats.orbitTarget.x, stats.orbitTarget.y, stats.orbitTarget.z)
          : null,
      ),
      leafClusterSet: {
        clusterCount: 0,
        cards: [],
      },
      budgets: buildLodBudgets({
        branches: Math.round(skeletonCount * 0.08),
        cards: 1,
        textureBudget: 'impostor-atlas',
        silhouetteTolerance: 'distance-only',
      }),
      previewStats: {
        frameCount: 16,
      },
    },
  ]

  return {
    specimenId: specimen.id ?? null,
    variantId: `${specimen.presetId ?? specimen.params.name ?? 'specimen'}:${specimen.params.seed}`,
    name: specimen.name,
    pivot: toPlainVector(rootAnchor),
    localRootAnchor: toPlainVector(rootAnchor),
    rootClearance: Number(rootRadius.toFixed(3)),
    placementAnchor: toPlainVector(new THREE.Vector3(0, rootRadius, 0)),
    landedAnchorOffset: toPlainVector(new THREE.Vector3(0, rootRadius, 0)),
    bounds,
    exportProfile,
    materials: visualFeatures.materialRecipe,
    lods,
  }
}
