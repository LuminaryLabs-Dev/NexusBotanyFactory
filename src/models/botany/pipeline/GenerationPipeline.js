import { assignVisualFeatures } from './assignVisualFeatures.js'
import { buildRenderArtifacts } from './buildRenderArtifacts.js'
import { buildStructureGraph } from './buildStructureGraph.js'
import { createSpecimenRecipe } from './createSpecimenRecipe.js'
import { deriveGrowthContext } from './deriveGrowthContext.js'

export class GenerationPipeline {
  constructor({
    mode,
    growthStrategy,
    leafPlacementStrategy,
    twigGrowthStrategy,
  }) {
    this.mode = mode
    this.growthStrategy = growthStrategy
    this.leafPlacementStrategy = leafPlacementStrategy
    this.twigGrowthStrategy = twigGrowthStrategy
  }

  run(specimen) {
    const recipe = createSpecimenRecipe(specimen, {
      mode: this.mode,
      growthStrategyKey: this.growthStrategy?.registryKey,
      leafPlacementKey: this.leafPlacementStrategy?.registryKey,
      twigStrategyKey: this.twigGrowthStrategy?.registryKey,
    })
    const growthContext = deriveGrowthContext(recipe)
    const structureGraph = buildStructureGraph({
      recipe,
      growthStrategy: this.growthStrategy,
      leafPlacementStrategy: this.leafPlacementStrategy,
      twigGrowthStrategy: this.twigGrowthStrategy,
    })
    const visualFeatures = assignVisualFeatures({
      recipe,
      growthContext,
      structureGraph,
    })
    const renderArtifacts = buildRenderArtifacts({
      recipe,
      structureGraph,
      visualFeatures,
    })

    return {
      recipe,
      growthContext,
      structureGraph,
      visualFeatures,
      renderArtifacts,
      treeData: structureGraph.treeData,
    }
  }
}
