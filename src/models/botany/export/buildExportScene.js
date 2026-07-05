import * as THREE from 'three'
import { buildTreeGeometry } from '../generation/geometry.js'
import { getImpostorFrameUvRect, getImpostorFrameAnchor } from '../impostors/impostorFrames.js'
import { createBarkMaterial, createLeafMaterial } from '../rendering/materialRecipes.js'

const toVector3 = (value, fallback = new THREE.Vector3(0, 0, 0)) => {
  if (value instanceof THREE.Vector3) {
    return value.clone()
  }

  if (value && typeof value === 'object') {
    return new THREE.Vector3(
      Number(value.x ?? fallback.x ?? 0),
      Number(value.y ?? fallback.y ?? 0),
      Number(value.z ?? fallback.z ?? 0),
    )
  }

  return (fallback instanceof THREE.Vector3 ? fallback : new THREE.Vector3(0, 0, 0)).clone()
}

const getBoneIdsForLod = (generated, lodDescriptor) => {
  const maxDepth = lodDescriptor?.meshData?.maxDepth
  const minRadius = lodDescriptor?.meshData?.minRadius ?? 0
  const includeTwigs = lodDescriptor?.meshData?.includeTwigs ?? true
  const boneIds = new Set()

  generated.treeData.skeleton.forEach((bone) => {
    if (maxDepth != null && bone.depth > maxDepth) return
    if (bone.radius < minRadius) return
    if (!includeTwigs && bone.isTwig) return
    boneIds.add(bone.id)
  })

  return boneIds
}

export const createTreeDataForLod = (generated, lodDescriptor) => {
  const allowedBoneIds = getBoneIdsForLod(generated, lodDescriptor)
  const allowedNodes = generated.treeData.nodes.filter((node) => {
    const depthAllowed = lodDescriptor?.meshData?.maxDepth == null || node.depth <= lodDescriptor.meshData.maxDepth
    if (!depthAllowed) return false
    return node.points.some((point) => allowedBoneIds.has(point.id))
  }).map((node) => ({
    ...node,
    points: node.points.filter((point) => allowedBoneIds.has(point.id)),
  })).filter((node) => node.points.length >= 2)

  return {
    rootAnchor: generated.treeData.rootAnchor ?? null,
    rootRadius: generated.treeData.rootRadius ?? null,
    nodes: allowedNodes,
    skeleton: generated.treeData.skeleton.filter((bone) => allowedBoneIds.has(bone.id)),
    leafInstances: generated.treeData.leafInstances,
  }
}

export const buildLeafInstanceGeometry = (generated, materialRecipe) => {
  const geometry = new THREE.BufferGeometry()
  const leaves = generated?.treeData?.leafInstances ?? []
  if (leaves.length === 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute([], 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([], 2))
    geometry.setIndex([])
    return geometry
  }

  const positions = []
  const normals = []
  const uvs = []
  const indices = []
  const basePositions = [
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(-0.5, 0.5, 0),
  ]
  const baseUvs = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const baseNormal = new THREE.Vector3(0, 0, 1)
  const dummy = new THREE.Object3D()
  const scaleBase = materialRecipe?.foliage?.leafStyle === 'needle'
    ? (materialRecipe?.foliage?.leafSize ?? 0.5) * 3.5
    : (materialRecipe?.foliage?.leafSize ?? 0.5)
  const normalMatrix = new THREE.Matrix3()

  leaves.forEach((leaf, index) => {
    dummy.position.copy(leaf.pos)
    dummy.lookAt(leaf.pos.clone().add(leaf.dir))
    dummy.rotateZ(leaf.roll ?? 0)
    dummy.scale.setScalar(scaleBase)
    dummy.updateMatrixWorld(true)
    normalMatrix.getNormalMatrix(dummy.matrixWorld)

    basePositions.forEach((basePosition, vertexIndex) => {
      const transformed = basePosition.clone().applyMatrix4(dummy.matrixWorld)
      positions.push(transformed.x, transformed.y, transformed.z)

      const transformedNormal = baseNormal.clone().applyMatrix3(normalMatrix).normalize()
      normals.push(transformedNormal.x, transformedNormal.y, transformedNormal.z)
      uvs.push(baseUvs[vertexIndex][0], baseUvs[vertexIndex][1])
    })

    const offset = index * 4
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3)
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

const createLeafCardGroup = (lodDescriptor, materialRecipe) => {
  const group = new THREE.Group()
  const geometry = new THREE.PlaneGeometry(1, 1)
  const material = createLeafMaterial(materialRecipe, { showLeafDensity: false })

  lodDescriptor.leafCards.forEach((card) => {
    const mesh = new THREE.Mesh(geometry, material.clone())
    mesh.position.set(card.position.x, card.position.y, card.position.z)
    mesh.lookAt(
      card.position.x + card.direction.x,
      card.position.y + card.direction.y,
      card.position.z + card.direction.z,
    )
    mesh.rotateZ(card.roll ?? 0)
    mesh.scale.set(card.size.width, card.size.height, 1)
    group.add(mesh)
  })

  return group
}

const createImpostorGroup = (treeAsset, lodDescriptor, texture = null) => {
  const group = new THREE.Group()
  const size = lodDescriptor?.impostor?.billboardSize ?? { width: treeAsset.bounds.size.x, height: treeAsset.bounds.size.y }
  const geometry = new THREE.PlaneGeometry(size.width, size.height)
  const material = new THREE.MeshBasicMaterial({
    color: '#d8ead7',
    transparent: true,
    alphaTest: 0.05,
    map: texture,
  })
  if (texture) {
    const frameRect = getImpostorFrameUvRect(0, lodDescriptor?.impostor ?? lodDescriptor)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.repeat.set(frameRect.u1 - frameRect.u0, frameRect.v1 - frameRect.v0)
    texture.offset.set(frameRect.u0, frameRect.v0)
    texture.matrixAutoUpdate = true
    texture.updateMatrix?.()
  }
  const anchor = getImpostorFrameAnchor(treeAsset.pivot, lodDescriptor?.impostor ?? lodDescriptor)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(anchor.x, anchor.y, anchor.z)
  group.add(mesh)
  return group
}

export const buildFullTreeScene = ({ generated }) => {
  const scene = new THREE.Scene()
  const root = new THREE.Group()
  root.name = generated?.specimen?.name ?? generated?.treeAsset?.name ?? 'Tree'
  const rootAnchor = toVector3(generated.treeAsset?.localRootAnchor ?? generated.treeAsset?.pivot)
  root.position.set(-rootAnchor.x, -rootAnchor.y, -rootAnchor.z)
  const materialRecipe = generated.treeAsset?.materials ?? generated.renderArtifacts?.materialRecipe
  const lod0 = generated.treeAsset?.lods?.find((lod) => lod.level === 0) ?? generated.treeAsset?.lods?.[0] ?? null

  const treeData = lod0 ? createTreeDataForLod(generated, lod0) : generated.treeData
  const trunkGeometry = buildTreeGeometry(treeData, {
    radialSegments: lod0?.meshData?.radialSegments ?? 8,
  })
  const trunkMesh = new THREE.Mesh(trunkGeometry, createBarkMaterial(materialRecipe, { showStructure: false }))
  trunkMesh.name = 'Trunk'
  root.add(trunkMesh)

  if ((generated.treeData?.leafInstances?.length ?? 0) > 0) {
    const leafGeometry = buildLeafInstanceGeometry(generated, materialRecipe)
    const leafMesh = new THREE.Mesh(leafGeometry, createLeafMaterial(materialRecipe, { showLeafDensity: false }))
    leafMesh.name = 'Leaves'
    root.add(leafMesh)
  }

  scene.add(root)
  return scene
}

export const buildLodScene = ({ generated, lodDescriptor, impostorTexture = null }) => {
  const scene = new THREE.Scene()
  const root = new THREE.Group()
  const rootAnchor = toVector3(generated.treeAsset?.localRootAnchor ?? generated.treeAsset?.pivot)
  root.position.set(-rootAnchor.x, -rootAnchor.y, -rootAnchor.z)
  const materialRecipe = generated.treeAsset?.materials ?? generated.renderArtifacts?.materialRecipe

  if (lodDescriptor.level <= 2) {
    const treeDataForLod = createTreeDataForLod(generated, lodDescriptor)
    const geometry = buildTreeGeometry(treeDataForLod, {
      radialSegments: lodDescriptor.meshData?.radialSegments ?? 8,
    })
    const trunkMesh = new THREE.Mesh(geometry, createBarkMaterial(materialRecipe, { showStructure: false }))
    root.add(trunkMesh)

    if (lodDescriptor.leafCards?.length) {
      root.add(createLeafCardGroup(lodDescriptor, materialRecipe))
    }
  } else {
    root.add(createImpostorGroup(generated.treeAsset, lodDescriptor, impostorTexture))
  }

  scene.add(root)
  return scene
}
