import * as THREE from 'three'

export const buildTreeGeometry = (treeData, options = {}) => {
  const vertices = []
  const normals = []
  const uvs = []
  const indices = []
  const radii = []
  const depths = []
  const branchTs = []
  let vertexOffset = 0
  const radialSegments = Math.max(3, Math.floor(options.radialSegments ?? 8))
  const nodeFilter = typeof options.nodeFilter === 'function' ? options.nodeFilter : () => true

  treeData.nodes.filter(nodeFilter).forEach((node) => {
    const points = node.points
    const numPoints = points.length
    if (numPoints < 2) return

    const tangents = new Array(numPoints)
    for (let index = 0; index < numPoints; index += 1) {
      if (index === 0) tangents[index] = points[1].pos.clone().sub(points[0].pos).normalize()
      else if (index === numPoints - 1) tangents[index] = points[index].pos.clone().sub(points[index - 1].pos).normalize()
      else tangents[index] = points[index].pos.clone().sub(points[index - 1].pos).normalize().add(points[index + 1].pos.clone().sub(points[index].pos).normalize()).normalize()
    }

    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3()
    const prevTangent = tangents[0].clone()
    const up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(up.dot(prevTangent)) > 0.99) up.set(1, 0, 0)

    normal.crossVectors(prevTangent, up).normalize()
    binormal.crossVectors(prevTangent, normal).normalize()

    for (let pointIndex = 0; pointIndex < numPoints; pointIndex += 1) {
      const point = points[pointIndex]
      const tangent = tangents[pointIndex]
      const axis = new THREE.Vector3().crossVectors(prevTangent, tangent)
      const dot = THREE.MathUtils.clamp(prevTangent.dot(tangent), -1, 1)
      if (axis.lengthSq() > 0.000001 && dot < 0.999999) {
        axis.normalize()
        normal.applyAxisAngle(axis, Math.acos(dot))
        normal.crossVectors(tangent, normal).crossVectors(normal, tangent).normalize()
      }
      binormal.crossVectors(tangent, normal).normalize()
      prevTangent.copy(tangent)

      for (let radialIndex = 0; radialIndex <= radialSegments; radialIndex += 1) {
        const angle = (radialIndex / radialSegments) * Math.PI * 2
        const n = new THREE.Vector3().copy(normal).multiplyScalar(Math.cos(angle)).add(binormal.clone().multiplyScalar(Math.sin(angle))).normalize()
        const vertex = point.pos.clone().add(n.clone().multiplyScalar(point.radius))
        vertices.push(vertex.x, vertex.y, vertex.z)
        normals.push(n.x, n.y, n.z)
        uvs.push(radialIndex / radialSegments, pointIndex / (numPoints - 1))
        radii.push(point.radius)
        depths.push(node.depth)
        branchTs.push(pointIndex / (numPoints - 1))

        if (pointIndex < numPoints - 1 && radialIndex < radialSegments) {
          const a = vertexOffset + (pointIndex * (radialSegments + 1)) + radialIndex
          const b = vertexOffset + ((pointIndex + 1) * (radialSegments + 1)) + radialIndex
          const c = vertexOffset + ((pointIndex + 1) * (radialSegments + 1)) + (radialIndex + 1)
          const d = vertexOffset + (pointIndex * (radialSegments + 1)) + (radialIndex + 1)
          indices.push(a, d, b, b, d, c)
        }
      }
    }

    vertexOffset += numPoints * (radialSegments + 1)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aRadius', new THREE.Float32BufferAttribute(radii, 1))
  geometry.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1))
  geometry.setAttribute('aBranchT', new THREE.Float32BufferAttribute(branchTs, 1))
  geometry.setIndex(indices)
  return geometry
}
