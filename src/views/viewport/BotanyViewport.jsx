'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildTreeGeometry } from '../../models/botany/generation/geometry.js'
import { getAutoOrbitCameraPose } from '../../models/botany/generation/camera.js'
import { createBarkMaterial, createLeafMaterial, updateBarkMaterial, updateLeafMaterial } from '../../models/botany/rendering/materialRecipes.js'
import { buildTerrainResources } from '../../models/botany/rendering/terrain.js'

const createSkyTexture = () => {
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
  return new THREE.CanvasTexture(canvas)
}

const getBootstrapCameraPose = () => ({
  position: new THREE.Vector3(120, 82, 148),
  target: new THREE.Vector3(0, 20, 0),
})

export default function BotanyViewport({ specimen, generated, debugMode, frameRequestToken, specimenRevision, generationRevision }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const terrainMeshRef = useRef(null)
  const treeGroupRef = useRef(new THREE.Group())
  const animationRef = useRef()
  const trunkMeshRef = useRef(null)
  const skeletonRef = useRef(null)
  const leavesRef = useRef(null)
  const leafGeometryRef = useRef(null)
  const structureSignatureRef = useRef(null)
  const foliageSignatureRef = useRef(null)
  const skyTextureRef = useRef(null)
  const terrainRecipeRef = useRef(generated?.renderArtifacts?.terrainRecipe)
  const orbitInitializedRef = useRef(false)
  const lastFrameRequestRef = useRef(frameRequestToken)
  const [rendererErrorState, setRendererErrorState] = useState(null)
  const auditMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('audit') === '1'
  const fallbackState = useMemo(
    () => (auditMode
      ? {
          mode: 'audit',
          message: 'Audit mode bypassed WebGL startup.',
        }
      : rendererErrorState),
    [auditMode, rendererErrorState],
  )
  const terrainSignature = generated?.renderArtifacts?.terrainSignature

  useEffect(() => {
    terrainRecipeRef.current = generated?.renderArtifacts?.terrainRecipe
  }, [generated?.renderArtifacts?.terrainRecipe, terrainSignature])

  useEffect(() => {
    if (!mountRef.current) return undefined

    const mountNode = mountRef.current
    if (auditMode) {
      return undefined
    }

    let resizeObserver
    let renderer

    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountNode.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const scene = new THREE.Scene()
      skyTextureRef.current = createSkyTexture()
      scene.background = skyTextureRef.current
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

      const terrainResources = buildTerrainResources(terrainRecipeRef.current)
      const terrain = new THREE.Mesh(terrainResources.terrainGeo, terrainResources.terrainMaterial)
      terrain.receiveShadow = true
      terrainMeshRef.current = terrain
      scene.add(terrain)
      scene.add(treeGroupRef.current)
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(30, mountNode.clientWidth / mountNode.clientHeight, 1, 2500)
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.enablePan = false
      controls.screenSpacePanning = false
      const bootstrapPose = getBootstrapCameraPose()
      camera.position.copy(bootstrapPose.position)
      controls.target.copy(bootstrapPose.target)
      controls.update()
      cameraRef.current = camera
      controlsRef.current = controls

      const animate = () => {
        controls.update()
        renderer.render(scene, camera)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()

      resizeObserver = new ResizeObserver(() => {
        if (!mountRef.current) return
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
        camera.aspect = mountRef.current.clientWidth / mountNode.clientHeight
        camera.updateProjectionMatrix()
      })
      resizeObserver.observe(mountNode)
    } catch (caughtError) {
      requestAnimationFrame(() => {
        setRendererErrorState({
          mode: 'webgl-unavailable',
          message: caughtError instanceof Error ? caughtError.message : 'WebGL renderer could not be created.',
        })
      })
    }

    return () => {
      resizeObserver?.disconnect()
      cancelAnimationFrame(animationRef.current)
      controlsRef.current?.dispose()
      terrainMeshRef.current?.geometry?.dispose()
      terrainMeshRef.current?.material?.dispose()
      trunkMeshRef.current?.geometry?.dispose()
      trunkMeshRef.current?.material?.dispose()
      skeletonRef.current?.geometry?.dispose()
      skeletonRef.current?.material?.dispose()
      leavesRef.current?.material?.dispose()
      leafGeometryRef.current?.dispose()
      skyTextureRef.current?.dispose()
      renderer?.dispose()
      mountNode.replaceChildren()
    }
  }, [auditMode])

  useEffect(() => {
    if (!terrainMeshRef.current || fallbackState) return

    const terrainResources = buildTerrainResources(terrainRecipeRef.current)
    terrainMeshRef.current.geometry.dispose()
    terrainMeshRef.current.material.dispose()
    terrainMeshRef.current.geometry = terrainResources.terrainGeo
    terrainMeshRef.current.material = terrainResources.terrainMaterial
  }, [fallbackState, terrainSignature])

  useEffect(() => {
    if (!generated?.treeData || !sceneRef.current || !cameraRef.current || !controlsRef.current || fallbackState) return

    const hasMatchingGeneratedRevision = generationRevision === specimenRevision
    const shouldFrame = !orbitInitializedRef.current || (
      frameRequestToken !== lastFrameRequestRef.current && hasMatchingGeneratedRevision
    )
    if (shouldFrame && generated?.stats?.orbitTarget) {
      const orbitTarget = new THREE.Vector3(
        generated.stats.orbitTarget.x,
        generated.stats.orbitTarget.y,
        generated.stats.orbitTarget.z,
      )
      const { position, target } = getAutoOrbitCameraPose(orbitTarget, generated.stats.estimatedHeight)
      cameraRef.current.position.copy(position)
      controlsRef.current.target.copy(target)
      controlsRef.current.update()
      orbitInitializedRef.current = true
      lastFrameRequestRef.current = frameRequestToken
    }

    const showBones = debugMode === 'bones'
    const showLeafDensity = debugMode === 'leaf-density'
    const showStructure = debugMode === 'structure'
    const materialRecipe = generated.renderArtifacts?.materialRecipe ?? {
      bark: {
        barkColor: specimen.params.barkColor,
        fiberIntensity: specimen.params.fiberIntensity,
      },
      foliage: {
        leafColor: specimen.params.leafColor,
      },
    }

    if (structureSignatureRef.current !== generated.renderArtifacts?.structureSignature) {
      structureSignatureRef.current = generated.renderArtifacts?.structureSignature ?? null
      const nextGeometry = buildTreeGeometry(generated.treeData)

      if (!trunkMeshRef.current) {
        trunkMeshRef.current = new THREE.Mesh(nextGeometry, createBarkMaterial(materialRecipe, { showStructure }))
        trunkMeshRef.current.castShadow = true
        trunkMeshRef.current.receiveShadow = true
        treeGroupRef.current.add(trunkMeshRef.current)
      } else {
        trunkMeshRef.current.geometry.dispose()
        trunkMeshRef.current.geometry = nextGeometry
      }

      if (skeletonRef.current) {
        skeletonRef.current.geometry.dispose()
        skeletonRef.current.material.dispose()
        treeGroupRef.current.remove(skeletonRef.current)
        skeletonRef.current = null
      }

      const points = []
      generated.treeData.skeleton.forEach((bone) => {
        if (bone.parentId == null || bone.parentId < 0) return
        const parent = generated.treeData.skeleton.find((candidate) => candidate.id === bone.parentId)
        if (!parent) return
        points.push(parent.pos, bone.pos)
      })
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({ color: '#456853' })
      skeletonRef.current = new THREE.LineSegments(geometry, material)
      treeGroupRef.current.add(skeletonRef.current)
    }

    if (trunkMeshRef.current) {
      if (!trunkMeshRef.current.material) {
        trunkMeshRef.current.material = createBarkMaterial(materialRecipe, { showStructure })
      } else {
        updateBarkMaterial(trunkMeshRef.current.material, materialRecipe, { showStructure })
      }
      trunkMeshRef.current.visible = !showBones
    }

    if (skeletonRef.current) {
      skeletonRef.current.visible = showBones
    }

    if (specimen.params.leafCount > 0 && generated.treeData.leafInstances.length > 0) {
      if (!leafGeometryRef.current) {
        leafGeometryRef.current = new THREE.PlaneGeometry(1, 1)
      }

      if (
        !leavesRef.current
        || foliageSignatureRef.current !== generated.renderArtifacts?.foliageSignature
        || leavesRef.current.count !== generated.treeData.leafInstances.length
      ) {
        foliageSignatureRef.current = generated.renderArtifacts?.foliageSignature ?? null
        if (leavesRef.current) {
          leavesRef.current.material.dispose()
          treeGroupRef.current.remove(leavesRef.current)
        }

        leavesRef.current = new THREE.InstancedMesh(
          leafGeometryRef.current,
          createLeafMaterial(materialRecipe, { showLeafDensity }),
          generated.treeData.leafInstances.length,
        )
        leavesRef.current.castShadow = true
        treeGroupRef.current.add(leavesRef.current)
      }

      updateLeafMaterial(leavesRef.current.material, materialRecipe, { showLeafDensity })
      const dummy = new THREE.Object3D()
      generated.treeData.leafInstances.forEach((leaf, index) => {
        dummy.position.copy(leaf.pos)
        dummy.lookAt(leaf.pos.clone().add(leaf.dir))
        dummy.rotateZ(leaf.roll)
        dummy.scale.setScalar(specimen.params.leafStyle === 'needle' ? specimen.params.leafSize * 3.5 : specimen.params.leafSize)
        dummy.updateMatrix()
        leavesRef.current.setMatrixAt(index, dummy.matrix)
      })
      leavesRef.current.instanceMatrix.needsUpdate = true
      leavesRef.current.visible = !showBones
    } else if (leavesRef.current) {
      leavesRef.current.visible = false
    }
  }, [debugMode, fallbackState, frameRequestToken, generated, generationRevision, specimen.params, specimenRevision])

  return (
    <div ref={mountRef} className="relative h-full w-full cursor-crosshair overflow-hidden">
      {fallbackState ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="glass-panel-strong max-w-xl rounded-[1.8rem] px-6 py-6 text-[color:var(--text-secondary)] shadow-[0_30px_80px_rgba(34,65,43,0.18)]">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
              {fallbackState.mode === 'audit' ? 'Audit Mode' : 'Renderer Fallback'}
            </div>
            <h3 className="pt-2 text-lg font-black uppercase tracking-[0.16em] text-[color:var(--text-primary)]">
              Viewport running without WebGL
            </h3>
            <p className="pt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
              {fallbackState.message}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              <div className="glass-panel rounded-[1rem] px-4 py-3">
                <div>Preset</div>
                <div className="pt-2 text-[color:var(--text-primary)]">{specimen.params.name}</div>
              </div>
              <div className="glass-panel rounded-[1rem] px-4 py-3">
                <div>Mode</div>
                <div className="pt-2 text-[color:var(--text-primary)]">{debugMode}</div>
              </div>
              <div className="glass-panel rounded-[1rem] px-4 py-3">
                <div>Bones</div>
                <div className="pt-2 text-[color:var(--text-primary)]">{generated?.stats?.boneCount ?? generated?.treeData?.skeleton.length ?? 0}</div>
              </div>
              <div className="glass-panel rounded-[1rem] px-4 py-3">
                <div>Leaves</div>
                <div className="pt-2 text-[color:var(--text-primary)]">{generated?.stats?.leafInstanceCount ?? generated?.treeData?.leafInstances.length ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
