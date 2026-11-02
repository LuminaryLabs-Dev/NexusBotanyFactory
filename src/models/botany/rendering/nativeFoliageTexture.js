import * as THREE from 'three'
import { getNativeFoliageProfile } from './nativeFoliageProfiles.js'

// Single texture per leaf silhouette. Thousands of instances share one GPU alpha map.
const textures = new Map()
const silhouette = (ctx, shape) => {
  if (shape === 'needles') {
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath()
      ctx.moveTo(64, 108)
      ctx.quadraticCurveTo(64 + i * 8, 54, 64 + i * 7, 16)
      ctx.quadraticCurveTo(64 + i * 4, 61, 64 + (i + 0.7) * 4, 108)
      ctx.closePath()
      ctx.fill()
    }
    return
  }
  if (shape === 'scales') {
    for (let i = 0; i < 7; i += 1) {
      const y = 104 - i * 12
      ctx.beginPath()
      ctx.ellipse(64 + (i % 2 ? -7 : 7), y, 17 - i, 16, i % 2 ? -0.4 : 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  if (shape === 'oak-lobed') {
    ctx.beginPath()
    ctx.moveTo(64, 113)
    ctx.bezierCurveTo(50, 98, 43, 101, 42, 89)
    ctx.bezierCurveTo(25, 89, 19, 78, 33, 69)
    ctx.bezierCurveTo(16, 60, 28, 45, 44, 51)
    ctx.bezierCurveTo(32, 30, 46, 23, 56, 34)
    ctx.quadraticCurveTo(64, 7, 72, 34)
    ctx.bezierCurveTo(83, 22, 98, 32, 84, 51)
    ctx.bezierCurveTo(102, 45, 110, 60, 95, 69)
    ctx.bezierCurveTo(111, 79, 104, 91, 87, 89)
    ctx.bezierCurveTo(85, 101, 77, 98, 64, 113)
  } else if (shape === 'lanceolate') {
    ctx.beginPath()
    ctx.moveTo(64, 115)
    ctx.bezierCurveTo(38, 70, 49, 26, 64, 10)
    ctx.bezierCurveTo(83, 31, 90, 79, 64, 115)
  } else if (shape === 'serrate') {
    ctx.beginPath()
    ctx.moveTo(64, 114)
    for (let i = 0; i < 7; i += 1) {
      const t = i / 7
      const y = 99 - t * 78
      const width = 12 + Math.sin(Math.PI * t) * 22
      ctx.lineTo(64 - width + (i % 2 ? 3 : -3), y)
    }
    ctx.lineTo(64, 12)
    for (let i = 6; i >= 0; i -= 1) {
      const t = i / 7
      const y = 99 - t * 78
      const width = 12 + Math.sin(Math.PI * t) * 22
      ctx.lineTo(64 + width + (i % 2 ? -3 : 3), y)
    }
  }
  ctx.closePath()
  ctx.fill()
}

export const getNativeFoliageTexture = (speciesName, fallbackStyle) => {
  const profile = getNativeFoliageProfile(speciesName, fallbackStyle)
  if (textures.has(profile.shape)) return textures.get(profile.shape)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 128)
  ctx.fillStyle = '#ffffff'
  silhouette(ctx, profile.shape)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  textures.set(profile.shape, texture)
  return texture
}
