import { getIn } from '../objectPaths.js'
import { getBuildWorkspaceSections } from '../../models/botany/ui/workspaceSpecs.js'

const RPC_VERSION = '1.0.0'
const RPC_GLOBAL_KEY = '__NEXUS_BOTANY_RPC__'

const createVisibleHints = (summary) => ({
  headerVisible: true,
  viewportVisible: true,
  inspectorVisible: true,
  summary,
})

const buildInspectorState = (editor) => {
  const sections = getBuildWorkspaceSections(editor.activeCustomDefinition).map((section) => ({
    id: section.id,
    title: section.title,
    helper: section.helper,
    fieldPaths: (section.fields ?? []).map((field) => field.path),
  }))

  const visibleFields = sections.flatMap((section) => section.fieldPaths.map((path) => ({
    path,
    value: getIn(editor.specimen, path),
    sectionId: section.id,
  })))

  return {
    sections,
    visibleFields,
  }
}

const buildSnapshot = (editor) => {
  const inspector = buildInspectorState(editor)
  return {
    shell: {
      screen: 'build',
      headerVisible: true,
      viewportVisible: true,
      inspectorVisible: true,
      pending: Boolean(editor.generationPending),
      status: editor.status,
      error: editor.error ?? null,
      generationError: editor.generationError ?? null,
    },
    specimen: {
      id: editor.specimen.id ?? null,
      name: editor.specimen.name,
      presetId: editor.specimen.presetId,
      kind: editor.specimen.kind,
      params: {
        seed: editor.specimen.params.seed,
        simulationYears: editor.specimen.params.simulationYears,
        ticksPerYear: editor.specimen.params.ticksPerYear,
        height: editor.specimen.params.height,
        radius: editor.specimen.params.radius,
        taper: editor.specimen.params.taper,
        recursion: editor.specimen.params.recursion,
        leafCount: editor.specimen.params.leafCount,
        leafSize: editor.specimen.params.leafSize,
        leaderCount: editor.specimen.params.leaderCount,
      },
    },
    simulation: {
      ...(editor.playback ?? {}),
      pending: Boolean(editor.generationPending),
      error: editor.generationError ?? null,
    },
    viewport: {
      debugMode: editor.debugMode,
      previewLodLevel: editor.previewLodLevel,
      frameRequestToken: editor.frameRequestToken,
      generationRevision: editor.generationRevision,
      specimenRevision: editor.specimenRevision,
      boneCount: editor.boneCount,
    },
    inspector,
    capabilities: {
      rpcVersion: RPC_VERSION,
      commandGroups: ['app', 'simulation', 'viewport', 'inspector', 'asset'],
    },
  }
}

const createResult = ({ ok = true, error = null, state = null, changed = false, visibleHints = null }) => ({
  ok,
  error,
  state,
  changed,
  visibleHints,
})

const normalizeNumber = (value, fallback) => {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

const createCommandHandlers = (editor) => ({
  'app.health': async () => createResult({
    state: {
      ok: true,
      version: RPC_VERSION,
      status: editor.status,
    },
    visibleHints: createVisibleHints('App shell and editor runtime are responsive.'),
  }),
  'app.capabilities': async () => createResult({
    state: {
      version: RPC_VERSION,
      commands: COMMAND_DEFINITIONS,
    },
  }),
  'app.getShellState': async () => createResult({
    state: buildSnapshot(editor).shell,
  }),
  'app.getSnapshot': async () => createResult({
    state: buildSnapshot(editor),
  }),
  'simulation.getState': async () => createResult({
    state: buildSnapshot(editor).simulation,
  }),
  'simulation.play': async () => {
    editor.playSimulation()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints('Playback should switch to the running state.'),
    })
  },
  'simulation.pause': async () => {
    editor.pauseSimulation()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints('Playback should switch to the paused state.'),
    })
  },
  'simulation.reset': async () => {
    editor.resetSimulation()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints('The simulation should return to its first tick.'),
    })
  },
  'simulation.step': async () => {
    editor.stepSimulation()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints('The timeline should advance by one tick.'),
    })
  },
  'simulation.seek': async (input = {}) => {
    const tick = normalizeNumber(input.tick, editor.playback?.absoluteTick ?? 0)
    editor.seekSimulationTick(tick)
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints(`The timeline should jump to tick ${tick}.`),
    })
  },
  'simulation.setSpeed': async (input = {}) => {
    const speed = normalizeNumber(input.speed, editor.playback?.speed ?? 1)
    editor.setPlaybackSpeed(speed)
    return createResult({
      changed: true,
      state: buildSnapshot(editor).simulation,
      visibleHints: createVisibleHints(`Playback speed should switch to ${speed}x.`),
    })
  },
  'viewport.getState': async () => createResult({
    state: buildSnapshot(editor).viewport,
  }),
  'viewport.frame': async () => {
    editor.requestFrame()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).viewport,
      visibleHints: createVisibleHints('The camera should reframe around the planted pine.'),
    })
  },
  'viewport.setDebugMode': async (input = {}) => {
    const mode = String(input.mode ?? editor.debugMode)
    editor.setDebugMode(mode)
    return createResult({
      changed: true,
      state: buildSnapshot(editor).viewport,
      visibleHints: createVisibleHints(`Viewport mode should switch to ${mode}.`),
    })
  },
  'viewport.setLod': async (input = {}) => {
    const lodLevel = normalizeNumber(input.level, editor.previewLodLevel)
    editor.setPreviewLodLevel(lodLevel)
    return createResult({
      changed: true,
      state: buildSnapshot(editor).viewport,
      visibleHints: createVisibleHints(`Viewport LOD should switch to LOD${lodLevel}.`),
    })
  },
  'inspector.getSections': async () => createResult({
    state: buildInspectorState(editor).sections,
  }),
  'inspector.getVisibleFields': async () => createResult({
    state: buildInspectorState(editor).visibleFields,
  }),
  'inspector.setFieldValue': async (input = {}) => {
    const path = String(input.path ?? '')
    if (!path.startsWith('params.')) {
      return createResult({
        ok: false,
        error: 'Inspector field paths must start with "params.".',
        state: buildInspectorState(editor),
      })
    }

    editor.updatePath(path, input.value)
    return createResult({
      changed: true,
      state: {
        path,
        value: getIn({ specimen: editor.specimen }, `specimen.${path}`),
      },
      visibleHints: createVisibleHints(`Inspector control ${path} should reflect the new value.`),
    })
  },
  'asset.getCurrent': async () => createResult({
    state: buildSnapshot(editor).specimen,
  }),
  'asset.save': async () => {
    await editor.saveAsset()
    return createResult({
      changed: true,
      state: {
        status: editor.status,
        specimenId: editor.specimen.id ?? null,
      },
      visibleHints: createVisibleHints('Status should reflect a successful save.'),
    })
  },
  'asset.randomizeSeed': async () => {
    editor.randomizeSeed()
    return createResult({
      changed: true,
      state: buildSnapshot(editor).specimen,
      visibleHints: createVisibleHints('The seed value should change and the specimen should regenerate.'),
    })
  },
  'asset.exportFbx': async () => {
    const result = await editor.exportFbx()
    return createResult({
      changed: true,
      state: {
        ...result,
        status: editor.status,
      },
      visibleHints: createVisibleHints('The export action should complete and the status area should update.'),
    })
  },
})

const COMMAND_DEFINITIONS = [
  'app.health',
  'app.capabilities',
  'app.getShellState',
  'app.getSnapshot',
  'simulation.getState',
  'simulation.play',
  'simulation.pause',
  'simulation.reset',
  'simulation.step',
  'simulation.seek',
  'simulation.setSpeed',
  'viewport.getState',
  'viewport.frame',
  'viewport.setDebugMode',
  'viewport.setLod',
  'inspector.getSections',
  'inspector.getVisibleFields',
  'inspector.setFieldValue',
  'asset.getCurrent',
  'asset.save',
  'asset.randomizeSeed',
  'asset.exportFbx',
]

export const createAppRpcRegistry = (editorRef) => ({
  version: RPC_VERSION,
  capabilities: {
    semantic: true,
    groups: ['app', 'simulation', 'viewport', 'inspector', 'asset'],
  },
  list() {
    return [...COMMAND_DEFINITIONS]
  },
  async invoke(name, input = {}) {
    const editor = editorRef.current
    if (!editor) {
      return createResult({
        ok: false,
        error: 'Editor RPC is not ready.',
      })
    }

    const handler = createCommandHandlers(editor)[name]
    if (!handler) {
      return createResult({
        ok: false,
        error: `Unknown RPC command: ${name}`,
      })
    }

    try {
      return await handler(input)
    } catch (error) {
      return createResult({
        ok: false,
        error: error instanceof Error ? error.message : 'RPC invocation failed.',
      })
    }
  },
  getSnapshot() {
    const editor = editorRef.current
    if (!editor) {
      return {
        shell: {
          screen: 'build',
          headerVisible: false,
          viewportVisible: false,
          inspectorVisible: false,
          pending: true,
          status: 'booting',
          error: 'Editor RPC is not ready.',
          generationError: null,
        },
      }
    }
    return buildSnapshot(editor)
  },
})

export const attachAppRpcRegistry = (editorRef) => {
  if (typeof window === 'undefined') return () => {}

  const registry = createAppRpcRegistry(editorRef)
  window[RPC_GLOBAL_KEY] = registry

  return () => {
    if (window[RPC_GLOBAL_KEY] === registry) {
      delete window[RPC_GLOBAL_KEY]
    }
  }
}

export const getAppRpcGlobalKey = () => RPC_GLOBAL_KEY
