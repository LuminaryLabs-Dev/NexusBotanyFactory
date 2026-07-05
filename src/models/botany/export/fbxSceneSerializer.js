import * as THREE from 'three'

const formatNumber = (value) => {
  if (Number.isInteger(value)) {
    return String(value)
  }
  return Number(value.toFixed(6)).toString()
}

const joinNumberArray = (values) => values.map(formatNumber).join(',')
const sanitizeName = (value, fallback) => String(value || fallback).replace(/[^\w.-]+/g, '_')
const indentBlock = (block, depth = 1) => {
  const prefix = '\t'.repeat(depth)
  return block
    .split('\n')
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join('\n')
}

const colorFromMaterial = (material, fallback) => {
  const color = material?.color
  if (!color) return fallback
  return {
    r: color.r,
    g: color.g,
    b: color.b,
  }
}

const collectMeshExportData = (scene) => {
  const meshes = []
  scene.updateWorldMatrix(true, true)

  scene.traverse((object) => {
    if (!object.isMesh || !object.geometry) return

    const geometry = object.geometry.index ? object.geometry.clone() : object.geometry.toNonIndexed()
    const indexedGeometry = geometry.index ? geometry : geometry.toNonIndexed()
    const positionAttribute = indexedGeometry.getAttribute('position')
    if (!positionAttribute) return

    const normalAttribute = indexedGeometry.getAttribute('normal')
    const uvAttribute = indexedGeometry.getAttribute('uv')
    const indexAttribute = indexedGeometry.getIndex()
    const worldMatrix = object.matrixWorld.clone()
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix)
    const vertices = []
    const polygonVertexIndex = []
    const normals = []
    const uvs = []
    const meshIndices = indexAttribute
      ? Array.from(indexAttribute.array)
      : Array.from({ length: positionAttribute.count }, (_, index) => index)

    for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex += 1) {
      const position = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex).applyMatrix4(worldMatrix)
      vertices.push(position.x, position.y, position.z)
    }

    for (let polygonIndex = 0; polygonIndex < meshIndices.length; polygonIndex += 3) {
      const a = meshIndices[polygonIndex]
      const b = meshIndices[polygonIndex + 1]
      const c = meshIndices[polygonIndex + 2]
      polygonVertexIndex.push(a, b, -c - 1)

      ;[a, b, c].forEach((vertexIndex) => {
        if (normalAttribute) {
          const normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, vertexIndex).applyMatrix3(normalMatrix).normalize()
          normals.push(normal.x, normal.y, normal.z)
        } else {
          normals.push(0, 1, 0)
        }

        if (uvAttribute) {
          uvs.push(uvAttribute.getX(vertexIndex), uvAttribute.getY(vertexIndex))
        } else {
          uvs.push(0, 0)
        }
      })
    }

    meshes.push({
      name: sanitizeName(object.name, `Mesh_${meshes.length}`),
      vertices,
      polygonVertexIndex,
      normals,
      uvs,
      materialColor: colorFromMaterial(object.material, { r: 0.7, g: 0.8, b: 0.7 }),
    })
  })

  return meshes
}

const buildDefinitionsSection = (meshCount) => {
  const modelCount = meshCount + 1
  const geometryCount = meshCount
  const materialCount = meshCount
  return `Definitions:  {
\tVersion: 100
\tCount: ${modelCount + geometryCount + materialCount}
\tObjectType: "Model" {
\t\tCount: ${modelCount}
\t}
\tObjectType: "Geometry" {
\t\tCount: ${geometryCount}
\t}
\tObjectType: "Material" {
\t\tCount: ${materialCount}
\t}
}
`
}

const buildGeometryBlock = (mesh, geometryId) => `Geometry: ${geometryId}, "Geometry::${mesh.name}", "Mesh" {
\tGeometryVersion: 124
\tVertices: *${mesh.vertices.length} {
\t\ta: ${joinNumberArray(mesh.vertices)}
\t}
\tPolygonVertexIndex: *${mesh.polygonVertexIndex.length} {
\t\ta: ${joinNumberArray(mesh.polygonVertexIndex)}
\t}
\tLayerElementNormal: 0 {
\t\tVersion: 101
\t\tName: ""
\t\tMappingInformationType: "ByPolygonVertex"
\t\tReferenceInformationType: "Direct"
\t\tNormals: *${mesh.normals.length} {
\t\t\ta: ${joinNumberArray(mesh.normals)}
\t\t}
\t}
\tLayerElementMaterial: 0 {
\t\tVersion: 101
\t\tName: ""
\t\tMappingInformationType: "AllSame"
\t\tReferenceInformationType: "IndexToDirect"
\t\tMaterials: *1 {
\t\t\ta: 0
\t\t}
\t}
\tLayerElementUV: 0 {
\t\tVersion: 101
\t\tName: "UVChannel_1"
\t\tMappingInformationType: "ByPolygonVertex"
\t\tReferenceInformationType: "Direct"
\t\tUV: *${mesh.uvs.length} {
\t\t\ta: ${joinNumberArray(mesh.uvs)}
\t\t}
\t}
\tLayer: 0 {
\t\tVersion: 100
\t\tLayerElement: {
\t\t\tType: "LayerElementNormal"
\t\t\tTypedIndex: 0
\t\t}
\t\tLayerElement: {
\t\t\tType: "LayerElementMaterial"
\t\t\tTypedIndex: 0
\t\t}
\t\tLayerElement: {
\t\t\tType: "LayerElementUV"
\t\t\tTypedIndex: 0
\t\t}
\t}
}
`

const buildModelBlock = (mesh, modelId) => `Model: ${modelId}, "Model::${mesh.name}", "Mesh" {
\tVersion: 232
\tProperties70:  {
\t\tP: "InheritType", "enum", "", "",1
\t\tP: "Lcl Translation", "Lcl Translation", "", "A",0,0,0
\t\tP: "Lcl Rotation", "Lcl Rotation", "", "A",0,0,0
\t\tP: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
\t}
\tShading: T
\tCulling: "CullingOff"
}
`

const buildMaterialBlock = (mesh, materialId) => `Material: ${materialId}, "Material::${mesh.name}_Material", "" {
\tVersion: 102
\tShadingModel: "phong"
\tMultiLayer: 0
\tProperties70:  {
\t\tP: "DiffuseColor", "Color", "", "A",${formatNumber(mesh.materialColor.r)},${formatNumber(mesh.materialColor.g)},${formatNumber(mesh.materialColor.b)}
\t\tP: "SpecularColor", "Color", "", "A",0,0,0
\t\tP: "AmbientColor", "Color", "", "A",0,0,0
\t\tP: "ShininessExponent", "Number", "", "A",12.3
\t\tP: "Opacity", "Number", "", "A",1
\t}
}
`

const buildRootModelBlock = (rootId, rootName) => `Model: ${rootId}, "Model::${sanitizeName(rootName, 'SceneRoot')}", "Null" {
\tVersion: 232
\tProperties70:  {
\t\tP: "InheritType", "enum", "", "",1
\t\tP: "Lcl Translation", "Lcl Translation", "", "A",0,0,0
\t\tP: "Lcl Rotation", "Lcl Rotation", "", "A",0,0,0
\t\tP: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
\t}
\tShading: T
\tCulling: "CullingOff"
}
`

export const sceneToAsciiFbx = (scene, { rootName = 'SceneRoot' } = {}) => {
  const meshes = collectMeshExportData(scene)
  if (meshes.length === 0) {
    throw new Error('Scene does not contain any mesh geometry to export.')
  }

  let nextId = 1000000000
  const rootId = nextId
  nextId += 1

  const objects = [indentBlock(buildRootModelBlock(rootId, rootName))]
  const connections = [`\tC: "OO", ${rootId}, 0`]

  meshes.forEach((mesh) => {
    const geometryId = nextId
    const modelId = nextId + 1
    const materialId = nextId + 2
    nextId += 3

    objects.push(indentBlock(buildGeometryBlock(mesh, geometryId)))
    objects.push(indentBlock(buildModelBlock(mesh, modelId)))
    objects.push(indentBlock(buildMaterialBlock(mesh, materialId)))
    connections.push(`\tC: "OO", ${geometryId}, ${modelId}`)
    connections.push(`\tC: "OO", ${modelId}, ${rootId}`)
    connections.push(`\tC: "OO", ${materialId}, ${modelId}`)
  })

  return `; FBX 7.4.0 project file
FBXHeaderExtension:  {
\tFBXHeaderVersion: 1003
\tFBXVersion: 7400
\tCreator: "NexusBotanyFactory"
}
Documents:  {
\tCount: 1
\tDocument: 1, "", "Scene" {
\t}
}
References:  {
}
GlobalSettings:  {
\tVersion: 1000
\tProperties70:  {
\t\tP: "UpAxis", "int", "Integer", "",1
\t\tP: "UpAxisSign", "int", "Integer", "",1
\t\tP: "FrontAxis", "int", "Integer", "",2
\t\tP: "FrontAxisSign", "int", "Integer", "",1
\t\tP: "CoordAxis", "int", "Integer", "",0
\t\tP: "CoordAxisSign", "int", "Integer", "",1
\t\tP: "UnitScaleFactor", "double", "Number", "",1
\t\tP: "OriginalUnitScaleFactor", "double", "Number", "",1
\t}
}
${buildDefinitionsSection(meshes.length)}Objects:  {
${objects.join('')}
}
Connections:  {
${connections.join('\n')}
}
Takes:  {
\tCurrent: ""
}
`
}
