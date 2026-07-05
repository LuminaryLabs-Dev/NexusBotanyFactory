import { BaseSpecimen } from '../specimen/BaseSpecimen.js'
import { CameraTargetStrategy } from '../strategies/CameraTargetStrategy.js'
import { LeafPlacementStrategy } from '../strategies/LeafPlacementStrategy.js'
import { BaseGrowthStrategy } from '../strategies/BranchGrowthStrategy.js'
import { TwigGrowthStrategy } from '../strategies/TwigGrowthStrategy.js'
import { getSpecimenOrbitTarget } from '../generation/camera.js'
import { GenerationPipeline } from '../pipeline/GenerationPipeline.js'
import { buildGeneratedTreeAsset } from '../lod/buildTreeAsset.js'

export class BaseBotanyFactory {
  constructor({
    mode = 'broadleaf',
    specimenClass = BaseSpecimen,
    growthStrategy = new BaseGrowthStrategy(),
    leafPlacementStrategy = new LeafPlacementStrategy(),
    twigGrowthStrategy = new TwigGrowthStrategy(),
    cameraTargetStrategy = new CameraTargetStrategy(),
  } = {}) {
    this.mode = mode
    this.specimenClass = specimenClass
    this.growthStrategy = growthStrategy
    this.leafPlacementStrategy = leafPlacementStrategy
    this.twigGrowthStrategy = twigGrowthStrategy
    this.cameraTargetStrategy = cameraTargetStrategy
    this.pipeline = new GenerationPipeline({
      mode: this.mode,
      growthStrategy: this.growthStrategy,
      leafPlacementStrategy: this.leafPlacementStrategy,
      twigGrowthStrategy: this.twigGrowthStrategy,
    })
  }

  createSpecimen(input) {
    return new this.specimenClass(input)
  }

  normalize(specimen) {
    return specimen.normalize()
  }

  validate(specimen) {
    return specimen.validate()
  }

  generate(specimenInput) {
    const specimen = specimenInput instanceof BaseSpecimen ? specimenInput : this.createSpecimen(specimenInput)
    this.normalize(specimen)
    const validation = this.validate(specimen)
    if (!validation.valid) {
      return { specimen, validation, treeData: null, stats: null, orbitTarget: null }
    }

    const pipelineResult = this.pipeline.run(specimen)
    const treeData = pipelineResult.treeData
    const stats = this.summarize(specimen, treeData)
    const treeAsset = buildGeneratedTreeAsset({
      specimen,
      structureGraph: pipelineResult.structureGraph,
      visualFeatures: pipelineResult.visualFeatures,
      stats,
      exportProfileId: pipelineResult.visualFeatures?.exportProfile?.id,
    })
    const orbitTarget = this.cameraTargetStrategy.getOrbitTarget(specimen.params, treeData, stats?.estimatedHeight ?? null)
    return {
      specimen,
      validation,
      recipe: pipelineResult.recipe,
      growthContext: pipelineResult.growthContext,
      structureGraph: pipelineResult.structureGraph,
      visualFeatures: pipelineResult.visualFeatures,
      renderArtifacts: pipelineResult.renderArtifacts,
      treeData,
      treeAsset,
      orbitTarget,
      stats,
    }
  }

  summarize(specimen, treeData) {
    const rootAnchor = treeData.rootAnchor ?? treeData.skeleton[0]?.pos ?? null
    const rootRadius = treeData.rootRadius ?? treeData.skeleton[0]?.radius ?? 0
    const tipHeight = treeData.skeleton.reduce((maxHeight, bone) => Math.max(maxHeight, bone.pos.y), 0)
    const estimatedHeight = Number((tipHeight - (rootAnchor?.y ?? 0)).toFixed(3))
    const orbitTarget = getSpecimenOrbitTarget(specimen.params, treeData, estimatedHeight)
    return {
      presetName: specimen.params.name,
      recursion: specimen.params.recursion,
      skeletonCount: treeData.skeleton.length,
      branchNodeCount: treeData.nodes.length,
      leafInstanceCount: treeData.leafInstances.length,
      estimatedHeight,
      boneCount: treeData.skeleton.length,
      rootAnchor: rootAnchor
        ? {
            x: Number(rootAnchor.x.toFixed(3)),
            y: Number(rootAnchor.y.toFixed(3)),
            z: Number(rootAnchor.z.toFixed(3)),
          }
        : null,
      rootRadius: Number(rootRadius.toFixed(3)),
      placementAnchor: {
        x: 0,
        y: Number(rootRadius.toFixed(3)),
        z: 0,
      },
      landedAnchor: null,
      orbitTarget: {
        x: Number(orbitTarget.x.toFixed(3)),
        y: Number(orbitTarget.y.toFixed(3)),
        z: Number(orbitTarget.z.toFixed(3)),
      },
      orbitTargetSource: 'pre-placement-estimate',
    }
  }
}
