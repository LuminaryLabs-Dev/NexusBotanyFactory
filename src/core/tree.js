import * as THREE from 'three'
import { mulberry32 } from './noise.js'

export const generateTreeData = (params) => {
  const rnd = mulberry32(params.seed)
  const skeleton = []
  const nodes = []
  const anchorSegments = []
  const goldenAngle = 137.508 * (Math.PI / 180)

  const grow = (startPos, startDir, length, radius, depth, parentBranchIdx = -1, parentBoneId = -1) => {
    if (depth > params.recursion || radius < 0.005 || length < 0.05) return

    const lvl = params.levels[Math.min(depth, params.levels.length - 1)]
    const segments = Math.max(3, lvl.segments)

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

    let prevBoneId = initialBoneId

    for (let i = 1; i <= segments; i++) {
      const t = i / segments
      const tropVec = new THREE.Vector3(0, 1, 0).multiplyScalar(params.tropismUp * 0.1)
      const gravVec = new THREE.Vector3(0, -1, 0).multiplyScalar(params.gravity * 0.15 * t)
      const noise = new THREE.Vector3((rnd() - 0.5) * lvl.curve, (rnd() - 0.5) * lvl.curve, (rnd() - 0.5) * lvl.curve).multiplyScalar(0.2)

      currentDir.add(tropVec).add(gravVec).add(noise).normalize()
      const stepLength = length / segments
      const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(stepLength))
      const currentRadius = radius * (1 - (t * (1 - params.taper)))

      const newBoneId = skeleton.length
      const bone = { id: newBoneId, parentId: prevBoneId, pos: nextPos.clone(), dir: currentDir.clone(), radius: currentRadius, depth, length: stepLength, isTwig: false }
      skeleton.push(bone)
      nodePoints.push({ ...bone, t, boneId: newBoneId })

      const isAnchor = (params.leafStyle === 'shell')
        ? (depth >= 1)
        : (params.leafStyle === 'hanging'
            ? (depth >= Math.max(1, params.recursion - 2) && t > 0.3)
            : (depth >= Math.max(1, params.recursion - 1) && t > 0.5))
      if (isAnchor) anchorSegments.push(bone)

      currentPos.copy(nextPos)
      prevBoneId = newBoneId
    }

    const nodeIdx = nodes.length
    nodes.push({ points: nodePoints, depth, parentIdx: parentBranchIdx })

    if (depth < params.recursion) {
      const childCount = Math.max(0, Math.floor(lvl.branchCount + (rnd() * 0.5)))
      let currentSpin = rnd() * Math.PI * 2

      if (params.name === 'Pine' || params.leafStyle === 'needle') {
        const minT = depth === 0 ? 0.1 : 0.05
        for (let j = 0; j < childCount; j++) {
          const t = minT + (1 - minT) * ((j + 0.5) / childCount)
          const spawnIdx = Math.floor(t * segments)
          const spawnPoint = nodePoints[spawnIdx]
          const coneTaper = 1.0 - (depth === 0 ? t : Math.pow(t, 0.4))
          const childLengthBase = depth === 0 ? params.height * lvl.lengthScale : length * lvl.lengthScale
          const childLength = childLengthBase * coneTaper * (0.8 + rnd() * 0.4)
          const childRadius = spawnPoint.radius * lvl.radiusScale * (0.8 + rnd() * 0.3)
          if (childLength > 0.1 && childRadius > 0.005) {
            const spawnDir = spawnPoint.dir.clone()
            if (depth === 0) {
              let axis = new THREE.Vector3(0, 0, 1).cross(spawnDir).normalize()
              if (axis.lengthSq() < 0.1) axis.set(1, 0, 0)
              spawnDir.applyAxisAngle(axis, lvl.branchAngle)
              spawnDir.applyAxisAngle(spawnPoint.dir, currentSpin)
              currentSpin += goldenAngle * 2.0
              const horizontal = new THREE.Vector3(spawnDir.x, 0.05, spawnDir.z).normalize()
              spawnDir.lerp(horizontal, 0.8).normalize()
            } else {
              const up = new THREE.Vector3(0, 1, 0)
              const side = new THREE.Vector3().crossVectors(up, spawnPoint.dir).normalize()
              if (side.lengthSq() < 0.01) side.set(1, 0, 0)
              if (j % 2 === 0) side.negate()
              spawnDir.lerp(side, lvl.branchAngle * 0.9).normalize()
              spawnDir.y += 0.2
              spawnDir.normalize()
            }
            grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId)
          }
        }
      } else {
        for (let j = 0; j < childCount; j++) {
          const minT = depth === 0 ? 0.2 : 0.1
          const t = minT + (1 - minT) * ((j + 0.5) / childCount)
          const spawnIdx = Math.floor(t * segments)
          const spawnPoint = nodePoints[spawnIdx]
          const ageFactor = 1.0 - t
          const energyRatio = THREE.MathUtils.lerp(0.3 + 0.7 * ageFactor, 0.4, lvl.apicalControl ?? 0.5)
          const childLength = (depth === 0 ? params.height * lvl.lengthScale : length * lvl.lengthScale) * energyRatio * (0.8 + rnd() * 0.4)
          const childRadius = spawnPoint.radius * lvl.radiusScale * (0.8 + rnd() * 0.3)
          if (childLength > 0.1 && childRadius > 0.005) {
            const spawnDir = spawnPoint.dir.clone()
            let axis = new THREE.Vector3(0, 1, 0).cross(spawnDir).normalize()
            if (axis.length() < 0.1) axis.set(1, 0, 0)
            spawnDir.applyAxisAngle(axis, lvl.branchAngle * (1 - 0.3 * t) + (rnd() - 0.5) * 0.2)
            spawnDir.applyAxisAngle(spawnPoint.dir, currentSpin)
            currentSpin += goldenAngle + (rnd() - 0.5) * 0.2
            grow(spawnPoint.pos, spawnDir, childLength, childRadius, depth + 1, nodeIdx, spawnPoint.boneId)
          }
        }
      }

      const splitChance = lvl.splitChance ?? 0.2
      if (depth > 0 && rnd() < splitChance) {
        const tipPoint = nodePoints[segments]
        const sideDir = tipPoint.dir.clone()
        let axis = new THREE.Vector3(0, 1, 0).cross(sideDir).normalize()
        if (axis.length() < 0.1) axis.set(1, 0, 0)
        const forkAngle = lvl.branchAngle * 0.6
        sideDir.applyAxisAngle(axis, forkAngle)
        sideDir.applyAxisAngle(tipPoint.dir, rnd() * Math.PI * 2)
        const coreDir = tipPoint.dir.clone().normalize()
        const oppositeAxis = axis.clone().applyAxisAngle(tipPoint.dir, Math.PI)
        coreDir.applyAxisAngle(oppositeAxis, forkAngle * 0.12)
        coreDir.normalize()
        grow(tipPoint.pos, coreDir, length * lvl.lengthScale * 0.92, tipPoint.radius * lvl.radiusScale * 0.95, depth + 1, nodeIdx, tipPoint.boneId)
        grow(tipPoint.pos, sideDir, length * lvl.lengthScale * 0.7, tipPoint.radius * lvl.radiusScale * 0.8, depth + 1, nodeIdx, tipPoint.boneId)
      }
    }
  }

  grow(new THREE.Vector3(0, 1.25, 0), new THREE.Vector3(0, 1, 0), params.height, params.radius, 0, -1, -1)

  const twigLeafAnchors = []
  const maxTwigSpawns = Math.min(anchorSegments.length, 1200)
  const selectedAnchors = []
  for (let i = 0; i < maxTwigSpawns; i++) {
    selectedAnchors.push(anchorSegments[Math.floor(Math.pow(rnd(), 0.6) * anchorSegments.length)])
  }

  selectedAnchors.forEach((anchorBone) => {
    const density = params.twigDensity ?? 3
    for (let i = 0; i < density; i++) {
      let currentPos = anchorBone.pos.clone()
      let currentDir
      if (params.leafStyle === 'needle') {
        const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), anchorBone.dir).normalize()
        if (side.length() < 0.1) side.set(1, 0, 0)
        if (i % 2 === 0) side.negate()
        currentDir = anchorBone.dir.clone().lerp(side, 0.4 + rnd() * 0.4).normalize()
      } else {
        const spreadAxis = new THREE.Vector3(0, 1, 0).cross(anchorBone.dir).normalize()
        if (spreadAxis.length() < 0.1) spreadAxis.set(1, 0, 0)
        currentDir = anchorBone.dir.clone().applyAxisAngle(spreadAxis, (rnd() - 0.1) * 1.5).applyAxisAngle(anchorBone.dir, rnd() * Math.PI * 2).normalize()
      }
      let parentBoneId = anchorBone.id
      const totalTwigLen = (params.twigLength ?? 1.0) * anchorBone.radius * 6.0
      const stepLen = totalTwigLen / 3
      const twigPath = []
      for (let j = 1; j <= 3; j++) {
        const t = j / 3
        currentDir.add(new THREE.Vector3(0, 1, 0).multiplyScalar((params.twigPhototropism ?? 0.8) * 0.5)).add(new THREE.Vector3(0, -1, 0).multiplyScalar((params.twigGravity ?? 0.2) * 0.5)).normalize()
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
      else if (arrangement === 'alternate') twigPath.forEach((b, idx) => twigLeafAnchors.push({ bone: b, type: 'alternate', flip: idx % 2 === 0 }))
      else if (arrangement === 'opposite') twigPath.forEach((b) => {
        twigLeafAnchors.push({ bone: b, type: 'opposite1' })
        twigLeafAnchors.push({ bone: b, type: 'opposite2' })
      })
    }
  })

  const leafInstances = []
  if (twigLeafAnchors.length > 0 && params.leafCount > 0) {
    for (let i = 0; i < Math.min(params.leafCount, 25000); i++) {
      const anchor = twigLeafAnchors[Math.floor(rnd() * twigLeafAnchors.length)]
      const bone = anchor.bone
      let angle = rnd() * Math.PI * 2
      let pitch = rnd()
      if (anchor.type === 'alternate') {
        angle = anchor.flip ? 0 : Math.PI
        angle += (rnd() - 0.5) * 0.5
        pitch = 0.2 + rnd() * 0.3
      } else if (anchor.type.startsWith('opposite')) {
        angle = (anchor.type === 'opposite1' ? 0 : Math.PI) + (rnd() - 0.5) * 0.3
        pitch = 0.2 + rnd() * 0.3
      }
      leafInstances.push({ pos: bone.pos.clone(), dir: bone.dir.clone(), radius: bone.radius, angle, pitch, roll: rnd() * Math.PI * 2, boneId: bone.id })
    }
  }

  return { nodes, skeleton, leafInstances }
}

export const buildTreeGeometry = (treeData) => {
  const vertices = []
  const normals = []
  const uvs = []
  const indices = []
  const radii = []
  const depths = []
  const branchTs = []
  let vertexOffset = 0
  const radialSegments = 8

  treeData.nodes.forEach((node) => {
    const points = node.points
    const numPoints = points.length
    if (numPoints < 2) return

    const tangents = new Array(numPoints)
    for (let i = 0; i < numPoints; i++) {
      if (i === 0) tangents[i] = points[1].pos.clone().sub(points[0].pos).normalize()
      else if (i === numPoints - 1) tangents[i] = points[i].pos.clone().sub(points[i - 1].pos).normalize()
      else tangents[i] = points[i].pos.clone().sub(points[i - 1].pos).normalize().add(points[i + 1].pos.clone().sub(points[i].pos).normalize()).normalize()
    }

    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3()
    const prevTangent = tangents[0].clone()
    const up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(up.dot(prevTangent)) > 0.99) up.set(1, 0, 0)

    normal.crossVectors(prevTangent, up).normalize()
    binormal.crossVectors(prevTangent, normal).normalize()

    for (let i = 0; i < numPoints; i++) {
      const p = points[i]
      const r = p.radius
      const tangent = tangents[i]
      const axis = new THREE.Vector3().crossVectors(prevTangent, tangent)
      const dot = THREE.MathUtils.clamp(prevTangent.dot(tangent), -1, 1)
      if (axis.lengthSq() > 0.000001 && dot < 0.999999) {
        axis.normalize()
        normal.applyAxisAngle(axis, Math.acos(dot))
        normal.crossVectors(tangent, normal).crossVectors(normal, tangent).normalize()
      }
      binormal.crossVectors(tangent, normal).normalize()
      prevTangent.copy(tangent)

      for (let j = 0; j <= radialSegments; j++) {
        const ang = (j / radialSegments) * Math.PI * 2
        const n = new THREE.Vector3().copy(normal).multiplyScalar(Math.cos(ang)).add(binormal.clone().multiplyScalar(Math.sin(ang))).normalize()
        const v = p.pos.clone().add(n.clone().multiplyScalar(r))
        vertices.push(v.x, v.y, v.z)
        normals.push(n.x, n.y, n.z)
        uvs.push(j / radialSegments, i / (numPoints - 1))
        radii.push(r)
        depths.push(node.depth)
        branchTs.push(i / (numPoints - 1))

        if (i < numPoints - 1 && j < radialSegments) {
          const a = vertexOffset + i * (radialSegments + 1) + j
          const b = vertexOffset + (i + 1) * (radialSegments + 1) + j
          const c = vertexOffset + (i + 1) * (radialSegments + 1) + (j + 1)
          const d = vertexOffset + i * (radialSegments + 1) + (j + 1)
          indices.push(a, d, b, b, d, c)
        }
      }
    }

    vertexOffset += numPoints * (radialSegments + 1)
  })

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setAttribute('aRadius', new THREE.Float32BufferAttribute(radii, 1))
  geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1))
  geo.setAttribute('aBranchT', new THREE.Float32BufferAttribute(branchTs, 1))
  geo.setIndex(indices)
  return geo
}