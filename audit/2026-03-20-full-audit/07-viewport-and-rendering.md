# Viewport and Rendering Audit

Key files:

- `src/views/viewport/BotanyViewport.jsx`
- `src/models/botany/generation/camera.js`
- `src/models/botany/rendering/terrain.js`
- `src/models/botany/rendering/materialRecipes.js`
- `src/models/botany/generation/geometry.js`

## Intended behavior

The viewport should:

- render terrain and the generated specimen
- keep orbit session-owned
- use a `Frame` action for reframing
- mount only in `Build`
- degrade safely when WebGL is unavailable

## Working

- only `Build` mounts the viewport
- the viewport exposes a clear renderer fallback instead of crashing the page
- fallback shows:
  - preset
  - mode
  - bones
  - leaves
- tree placement is adjusted against the terrain mesh
- camera framing uses generated tree height and orbit target logic
- terrain generation is separated into `rendering/terrain.js`

Evidence:

- `evidence/static/build.png`
- `evidence/static/ui-report.json`

## Important environmental limitation

In headless Playwright on this machine, WebGL cannot be created. The fallback path is therefore what I observed in automated browser testing.

Observed console errors:

- `THREE.WebGLRenderer: A WebGL context could not be created`
- `THREE.WebGLRenderer: Error creating WebGL context.`

This is not necessarily a user-facing production bug. It does confirm that the fallback path works.

## Gaps

- because the audit browser stayed in fallback mode, I could not verify final 3D framing visually inside Playwright
- the viewport code still does large update work inside one effect and remains fairly stateful
- `BotanyViewport.jsx` is carrying renderer bootstrap, terrain updates, placement, camera framing, and mesh lifecycle in one component

## Conclusion

The fallback and session-orbit work are real improvements. The remaining risk is maintainability and the amount of rendering responsibility concentrated in a single component.
