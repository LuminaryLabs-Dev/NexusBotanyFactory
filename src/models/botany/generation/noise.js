export const mulberry32 = (a) => {
  let t = a >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export const createNoise2D = (seed) => {
  const random = mulberry32(seed)
  const permutation = Array.from({ length: 256 }, (_, index) => index)

  for (let index = permutation.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const temp = permutation[index]
    permutation[index] = permutation[swapIndex]
    permutation[swapIndex] = temp
  }

  const table = [...permutation, ...permutation]
  const fade = (value) => value * value * value * (value * (value * 6 - 15) + 10)
  const lerp = (start, end, amount) => start + amount * (end - start)
  const grad = (hash, x, y) => {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  return (x, y) => {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)

    const aa = table[table[xi] + yi]
    const ab = table[table[xi] + yi + 1]
    const ba = table[table[xi + 1] + yi]
    const bb = table[table[xi + 1] + yi + 1]

    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v,
    )
  }
}
