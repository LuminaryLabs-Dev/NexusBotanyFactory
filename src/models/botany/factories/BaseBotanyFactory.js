import { BaseSpecimen } from '../specimen/BaseSpecimen.js'
import { CameraTargetStrategy } from '../strategies/CameraTargetStrategy.js'
import { LeafPlacementStrategy } from '../strategies/LeafPlacementStrategy.js'
import { BaseGrowthStrategy } from '../strategies/BranchGrowthStrategy.js'
import { TwigGrowthStrategy } from '../strategies/TwigGrowthStrategy.js'
import { getSpecimenOrbitTarget } from '../generation/camera.js'
import { GenerationPipeline } from '../pipeline/GenerationPipeline.js'

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
    const orbitTarget = this.cameraTargetStrategy.getOrbitTarget(specimen.params, treeData)
    return {
      specimen,
      validation,
      recipe: pipelineResult.recipe,
      growthContext: pipelineResult.growthContext,
      structureGraph: pipelineResult.structureGraph,
      visualFeatures: pipelineResult.visualFeatures,
      renderArtifacts: pipelineResult.renderArtifacts,
      treeData,
      orbitTarget,
      stats: this.summarize(specimen, treeData),
    }
  }

  summarize(specimen, treeData) {
    const tipHeight = treeData.skeleton.reduce((maxHeight, bone) => Math.max(maxHeight, bone.pos.y), 0)
    const orbitTarget = getSpecimenOrbitTarget(specimen.params, treeData)
    return {
      presetName: specimen.params.name,
      recursion: specimen.params.recursion,
      skeletonCount: treeData.skeleton.length,
      branchNodeCount: treeData.nodes.length,
      leafInstanceCount: treeData.leafInstances.length,
      estimatedHeight: Number(tipHeight.toFixed(3)),
      boneCount: treeData.skeleton.length,
      orbitTarget: {
        x: Number(orbitTarget.x.toFixed(3)),
        y: Number(orbitTarget.y.toFixed(3)),
        z: Number(orbitTarget.z.toFixed(3)),
      },
    }
  }
}
