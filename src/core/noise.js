export const mulberry32 = (a) => {
  return () => {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const createNoise2D = (seed) => {
  const rnd = mulberry32(seed)
  const p = new Uint8Array(256)

  for (let i = 0; i < 256; i++) {
    p[i] = i
  }

  for (let i = 255; i > 0; i--) {
    const r = Math.floor(rnd() * (i + 1))
    ;[p[i], p[r]] = [p[r], p[i]]
  }

  const perm = new Uint8Array(512)
  perm.set(p)
  perm.set(p, 256)

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (t, a, b) => a + t * (b - a)
  const grad = (hash, x, y) => {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  return (x, y) => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = fade(x)
    const v = fade(y)
    const a = perm[X] + Y
    const aa = perm[a]
    const ab = perm[a + 1]
    const b = perm[X + 1] + Y
    const ba = perm[b]
    const bb = perm[b + 1]
    return lerp(
      v,
      lerp(u, grad(perm[aa], x, y), grad(perm[ba], x - 1, y)),
      lerp(u, grad(perm[ab], x, y - 1), grad(perm[bb], x - 1, y - 1)),
    )
  }
}