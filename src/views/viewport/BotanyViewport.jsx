'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createNoise2D } from '../../models/botany/generation/noise.js'
import { buildTreeGeometry } from '../../models/botany/generation/geometry.js'
import { getOrbitCameraPose } from '../../models/botany/generation/camera.js'

const carveTerrainHeight = (x, z, noise) => {
  const ridgeAxis = (x * 0.0038) + (z * 0.0014)
  const ridgeNoise = noise((x * 0.0045) + 104, (z * 0.0045) - 62) * 18
  const carvedNoise = noise((x * 0.012) + 420, (z * 0.012) - 128) * 8.5
  const fineNoise = noise((x * 0.028) - 70, (z * 0.028) + 211) * 2.2
  const ridgeBands = Math.sin(ridgeAxis * 18) * 10.5
  const terraces = Math.round(((ridgeNoise + ridgeBands) / 5.25)) * 1.8
  const channels = -Math.pow(Math.abs(noise((x * 0.008) - 250, (z * 0.008) + 340)), 2.2) * 15
  const plateauMask = Math.exp(-(((x * x) + (z * z)) / (145 * 145)))
  const plantingRise = plateauMask * 5.8
  const plantingFlatten = plateauMask * ((ridgeNoise * 0.85) + ridgeBands + carvedNoise)
  return (ridgeNoise + ridgeBands + terraces + channels + carvedNoise + fineNoise + plantingRise) - plantingFlatten
}

const getTerrainColor = (height, slope) => {
  const low = new THREE.Color('#769475')
  const mid = new THREE.Color('#91a886')
  const high = new THREE.Color('#b8b7a4')
  const moss = new THREE.Color('#638565')
  const sediment = new THREE.Color('#d9d3be')
  const heightMix = THREE.MathUtils.clamp((height + 24) / 58, 0, 1)
  const slopeMix = THREE.MathUtils.clamp(slope * 2.4, 0, 1)
  const base = low.clone().lerp(mid, heightMix).lerp(high, Math.max(0, heightMix - 0.45) * 1.6)
  base.lerp(moss, Math.max(0, 1 - slopeMix) * 0.28)
  base.lerp(sediment, slopeMix * 0.42)
  return base
}

export default function BotanyViewport({ specimen, generated, debugMode }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const treeGroupRef = useRef(new THREE.Group())
  const animationRef = useRef()

  const barkUniforms = useMemo(() => ({
    uBarkColor: { value: new THREE.Color(specimen.params.barkColor) },
    uBarkTint: { value: new THREE.Color(specimen.params.barkTint) },
    uFiber: { value: specimen.params.fiberIntensity },
    uCrack: { value: specimen.params.crackDepth },
    uMoss: { value: specimen.params.mossAmount },
  }), [specimen.params.barkColor, specimen.params.barkTint, specimen.params.fiberIntensity, specimen.params.crackDepth, specimen.params.mossAmount])

  useEffect(() => {
    if (!mountRef.current) return undefined
    const mountNode = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountNode.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 512
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#b6d7cf')
    gradient.addColorStop(0.45, '#dcefe5')
    gradient.addColorStop(0.78, '#edf5ef')
    gradient.addColorStop(1, '#f8faf6')
    context.fillStyle = gradient
    context.fillRect(0, 0, 1, 512)
    scene.background = new THREE.CanvasTexture(canvas)
    scene.fog = new THREE.Fog('#e8f1ea', 900, 2200)
    scene.add(new THREE.HemisphereLight(0xf4fff6, 0x718468, 1.1))
    const keyLight = new THREE.DirectionalLight(0xfff7e8, 2.8)
    keyLight.position.set(52, 94, 22)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.bias = -0.0005
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xd7f1ea, 1.6)
    fillLight.position.set(-85, 42, -70)
    scene.add(fillLight)
    const bounceLight = new THREE.DirectionalLight(0x95a988, 0.45)
    bounceLight.position.set(0, 14, 120)
    scene.add(bounceLight)

    const terrainGeo = new THREE.PlaneGeometry(2800, 2800, 180, 180)
    terrainGeo.rotateX(-Math.PI / 2)
    const colorAttr = new THREE.BufferAttribute(new Float32Array(terrainGeo.attributes.position.count * 3), 3)
    terrainGeo.setAttribute('color', colorAttr)
    const noise = createNoise2D(42)
    for (let index = 0; index < terrainGeo.attributes.position.count; index += 1) {
      const x = terrainGeo.attributes.position.getX(index)
      const z = terrainGeo.attributes.position.getZ(index)
      const y = carveTerrainHeight(x, z, noise)
      terrainGeo.attributes.position.setY(index, y)
      const dx = carveTerrainHeight(x + 3, z, noise) - y
      const dz = carveTerrainHeight(x, z + 3, noise) - y
      const slope = Math.sqrt((dx * dx) + (dz * dz)) / 3
      const color = getTerrainColor(y, slope)
      colorAttr.setXYZ(index, color.r, color.g, color.b)
    }
    terrainGeo.computeVertexNormals()
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.02,
    })
    const terrain = new THREE.Mesh(terrainGeo, terrainMaterial)
    terrain.receiveShadow = true
    scene.add(terrain)
    scene.add(treeGroupRef.current)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(30, mountNode.clientWidth / mountNode.clientHeight, 1, 2500)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.screenSpacePanning = false
    cameraRef.current = camera
    controlsRef.current = controls

    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current) return
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(mountNode)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationRef.current)
      controls.dispose()
      terrainGeo.dispose()
      terrainMaterial.dispose()
      renderer.dispose()
      mountNode.replaceChildren()
    }
  }, [])

  useEffect(() => {
    if (!generated?.treeData || !sceneRef.current || !cameraRef.current || !controlsRef.current) return

    while (treeGroupRef.current.children.length > 0) {
      const child = treeGroupRef.current.children[0]
      if (child.geometry) child.geometry.dispose()
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose())
      else if (child.material) child.material.dispose()
      treeGroupRef.current.remove(child)
    }

    const orbitTarget = new THREE.Vector3(
      generated.stats.orbitTarget.x,
      generated.stats.orbitTarget.y,
      generated.stats.orbitTarget.z,
    )
    const { position, target } = getOrbitCameraPose(specimen.params, orbitTarget)
    cameraRef.current.position.copy(position)
    controlsRef.current.target.copy(target)
    controlsRef.current.update()

    if (debugMode !== 'skeleton') {
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: specimen.params.barkColor,
        roughness: Math.max(0.25, 1 - (barkUniforms.uFiber.value.value * 0.2)),
      })
      const trunkMesh = new THREE.Mesh(buildTreeGeometry(generated.treeData), trunkMaterial)
      trunkMesh.castShadow = true
      trunkMesh.receiveShadow = true
      treeGroupRef.current.add(trunkMesh)
    }

    if (specimen.params.leafCount > 0 && generated.treeData.leafInstances.length > 0) {
      const leafGeometry = new THREE.PlaneGeometry(1, 1)
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: specimen.params.leafColor,
        side: THREE.DoubleSide,
        roughness: 0.8,
      })
      const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, generated.treeData.leafInstances.length)
      const dummy = new THREE.Object3D()
      generated.treeData.leafInstances.forEach((leaf, index) => {
        dummy.position.copy(leaf.pos)
        dummy.lookAt(leaf.pos.clone().add(leaf.dir))
        dummy.rotateZ(leaf.roll)
        dummy.scale.setScalar(specimen.params.leafStyle === 'needle' ? specimen.params.leafSize * 3.5 : specimen.params.leafSize)
        dummy.updateMatrix()
        leaves.setMatrixAt(index, dummy.matrix)
      })
      leaves.instanceMatrix.needsUpdate = true
      leaves.castShadow = true
      treeGroupRef.current.add(leaves)
    }
  }, [barkUniforms, debugMode, generated, specimen.params])

  return <div ref={mountRef} className="w-full h-full cursor-crosshair" />
}
