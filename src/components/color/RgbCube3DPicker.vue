<template>
  <div class="cube-wrap">
    <div class="cube-controls">
      <div class="ctrl">
        <label>Resolution</label>
        <input type="range" min="3" max="255" :value="resolution" @input="onResolutionInput" />
        <span>{{ resolution }} levels</span>
      </div>

      <div class="ctrl-grid">
        <div class="ctrl">
          <label>R Cut</label>
          <input type="range" :min="0" :max="resolution - 1" :value="cutR" @input="onCutInput('r', $event)" />
          <span>{{ cutRChannel }}</span>
        </div>
        <div class="ctrl">
          <label>G Cut</label>
          <input type="range" :min="0" :max="resolution - 1" :value="cutG" @input="onCutInput('g', $event)" />
          <span>{{ cutGChannel }}</span>
        </div>
        <div class="ctrl">
          <label>B Cut</label>
          <input type="range" :min="0" :max="resolution - 1" :value="cutB" @input="onCutInput('b', $event)" />
          <span>{{ cutBChannel }}</span>
        </div>
      </div>

      <div class="cube-actions">
        <button type="button" class="camera-reset-btn" @click="resetCamera">Reset Camera</button>
      </div>
    </div>

    <div v-if="!loadError" class="cube-canvas-shell">
      <div ref="canvasHost" class="cube-canvas"></div>
      <div class="axis-widget" aria-hidden="true">
        <div ref="axisHost" class="axis-gizmo"></div>
      </div>
    </div>
    <div v-else class="cube-error">{{ loadError }}</div>

    <p class="cube-hint">Drag to rotate camera. Click the cube to pick a color.</p>
    <p class="cube-picked">Selected: <strong>#{{ selectedHex }}</strong></p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'

type Axis = 'r' | 'g' | 'b'

const props = defineProps<{
  hex: string
}>()

const emit = defineEmits<{
  (e: 'pick', hex: string): void
}>()

const canvasHost = ref<HTMLElement | null>(null)
const resolution = ref(255)
const cutR = ref(254)
const cutG = ref(254)
const cutB = ref(254)
const selectedHex = ref(props.hex.replace('#', '').toUpperCase())
const loadError = ref('')
const axisHost = ref<HTMLElement | null>(null)

const cutRChannel = computed(() => idxToChannel(cutR.value, resolution.value))
const cutGChannel = computed(() => idxToChannel(cutG.value, resolution.value))
const cutBChannel = computed(() => idxToChannel(cutB.value, resolution.value))

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null

let cubeMaterial: THREE.ShaderMaterial | null = null
let cubeMesh: THREE.Mesh | null = null
let cubeWire: THREE.LineSegments | null = null
let markerRingLight: THREE.Mesh | null = null
let markerRingDark: THREE.Mesh | null = null
let resizeObserver: ResizeObserver | null = null
let axisScene: THREE.Scene | null = null
let axisCamera: THREE.PerspectiveCamera | null = null
let axisRenderer: THREE.WebGLRenderer | null = null
let axisRoot: THREE.Group | null = null
let axisLabelMaterials: THREE.SpriteMaterial[] = []

let raycaster: THREE.Raycaster | null = null
let ndcPointer: THREE.Vector2 | null = null
let cameraTarget = new THREE.Vector3(0, 0, 0)

let frameId: number | null = null
let isDragging = false
let dragMoved = false
let dragStartX = 0
let dragStartY = 0
let dragMode: 'rotate' | 'pan' | null = null

let yaw = Math.PI / 4
let pitch = 0.52
let distance = 2.25
let skipAutoSliceForHex: string | null = null

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function idxToNorm(idx: number, res: number): number {
  if (res <= 1) return 0
  return idx / (res - 1)
}

function idxToChannel(idx: number, res: number): number {
  if (res <= 1) return 0
  return Math.round((idx / (res - 1)) * 255)
}

function channelToNorm(channel: number): number {
  return clamp(channel, 0, 255) / 255
}

function channelToIdx(channel: number, res: number): number {
  if (res <= 1) return 0
  return Math.round((clamp(channel, 0, 255) / 255) * (res - 1))
}

function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').slice(0, 6).padEnd(6, '0')
  const r = parseInt(raw.slice(0, 2), 16) || 0
  const g = parseInt(raw.slice(2, 4), 16) || 0
  const b = parseInt(raw.slice(4, 6), 16) || 0
  return [r, g, b]
}

function currentMaxNorms(): [number, number, number] {
  return [
    idxToNorm(cutR.value, resolution.value),
    idxToNorm(cutG.value, resolution.value),
    idxToNorm(cutB.value, resolution.value),
  ]
}

function channelsToCoords(rNorm: number, gNorm: number, bNorm: number): [number, number, number] {
  // Axis mapping is flipped: X -> B, Y -> G, Z -> R.
  return [bNorm - 0.5, gNorm - 0.5, rNorm - 0.5]
}

function coordsToChannels(x: number, y: number, z: number): [number, number, number] {
  // Axis mapping is flipped: X -> B, Y -> G, Z -> R.
  return [z + 0.5, y + 0.5, x + 0.5]
}

function quantizeNorm(norm: number): number {
  const levels = Math.max(2, resolution.value)
  return clamp(Math.round(norm * (levels - 1)) / (levels - 1), 0, 1)
}

function requestRender() {
  if (!renderer || !scene || !camera || frameId !== null) return
  frameId = requestAnimationFrame(() => {
    frameId = null
    markerRingLight?.lookAt(camera.position)
    markerRingDark?.lookAt(camera.position)
    renderAxisGizmo()
    renderer.render(scene, camera)
  })
}

function disposeCubeGeometry() {
  if (cubeMesh) {
    cubeMesh.geometry.dispose()
  }
  if (cubeWire) {
    cubeWire.geometry.dispose()
  }
}

function updateCubeShape() {
  if (!scene || !cubeMesh) return

  disposeCubeGeometry()

  const [maxR, maxG, maxB] = currentMaxNorms()
  const sx = Math.max(0.001, maxB)
  const sy = Math.max(0.001, maxG)
  const sz = Math.max(0.001, maxR)

  cubeMesh.geometry = new THREE.BoxGeometry(sx, sy, sz)
  cubeMesh.position.set(-0.5 + sx / 2, -0.5 + sy / 2, -0.5 + sz / 2)

  if (cubeWire) {
    cubeWire.geometry = new THREE.EdgesGeometry(cubeMesh.geometry)
    cubeWire.position.copy(cubeMesh.position)
  }

  if (cubeMaterial) {
    cubeMaterial.uniforms.uLevels.value = Math.max(2, resolution.value)
  }

  clampMarkerToVisibleVolume()
  requestRender()
}

function computeDefaultDistance(): number {
  const [maxR, maxG, maxB] = currentMaxNorms()
  const maxDim = Math.max(maxR, maxG, maxB, 0.001)
  return clamp(1.35 + maxDim * 1.95, 1.55, 3.1)
}

function ensureTwoNonZeroCuts(r: number, g: number, b: number): [number, number, number] {
  const minCut = resolution.value > 1 ? 1 : 0
  const cuts = [r, g, b]
  const count = cuts.filter(v => v > 0).length
  if (count >= 2) return [cuts[0]!, cuts[1]!, cuts[2]!]

  if (count === 0) {
    cuts[0] = minCut
    cuts[1] = minCut
    return [cuts[0]!, cuts[1]!, cuts[2]!]
  }

  const first = cuts.findIndex(v => v > 0)
  cuts[(first + 1) % 3] = minCut
  return [cuts[0]!, cuts[1]!, cuts[2]!]
}

function setMarkerFromNorm(nr: number, ng: number, nb: number) {
  const [maxR, maxG, maxB] = currentMaxNorms()
  const r = clamp(nr, 0, maxR)
  const g = clamp(ng, 0, maxG)
  const b = clamp(nb, 0, maxB)
  const [x, y, z] = channelsToCoords(r, g, b)

  markerRingLight?.position.set(x, y, z)
  markerRingDark?.position.set(x, y, z)
  requestRender()
}

function setMarkerFromHex(hex: string) {
  const [r, g, b] = parseHex(hex)
  setMarkerFromNorm(channelToNorm(r), channelToNorm(g), channelToNorm(b))
}

function clampMarkerToVisibleVolume() {
  if (!markerRingLight) return
  const p = markerRingLight.position
  const [r, g, b] = coordsToChannels(p.x, p.y, p.z)
  setMarkerFromNorm(r, g, b)
}

function handlePick(clientX: number, clientY: number) {
  if (!renderer || !camera || !raycaster || !ndcPointer || !cubeMesh) return

  const rect = renderer.domElement.getBoundingClientRect()
  ndcPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
  ndcPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(ndcPointer, camera)
  const hits = raycaster.intersectObject(cubeMesh, false)
  if (!hits.length) return

  const point = hits[0]!.point
  const [maxR, maxG, maxB] = currentMaxNorms()

  const [hitR, hitG, hitB] = coordsToChannels(point.x, point.y, point.z)
  const nr = clamp(quantizeNorm(hitR), 0, maxR)
  const ng = clamp(quantizeNorm(hitG), 0, maxG)
  const nb = clamp(quantizeNorm(hitB), 0, maxB)

  setMarkerFromNorm(nr, ng, nb)

  const hex = rgbToHex(Math.round(nr * 255), Math.round(ng * 255), Math.round(nb * 255))
  selectedHex.value = hex
  skipAutoSliceForHex = hex
  emit('pick', hex)
}

function updateCamera() {
  if (!camera) return
  const cp = Math.cos(pitch)
  const ox = distance * cp * Math.cos(yaw)
  const oy = distance * Math.sin(pitch)
  const oz = distance * cp * Math.sin(yaw)
  camera.position.set(cameraTarget.x + ox, cameraTarget.y + oy, cameraTarget.z + oz)
  camera.lookAt(cameraTarget)
  requestRender()
}

function resetCamera() {
  yaw = Math.PI / 4
  pitch = 0.52
  distance = computeDefaultDistance()
  cameraTarget.set(0, 0, 0)
  updateCamera()
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 && event.button !== 2) return
  isDragging = true
  dragMoved = false
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragMode = event.button === 2 ? 'pan' : 'rotate'
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging || !camera || !dragMode) return
  const dx = event.clientX - dragStartX
  const dy = event.clientY - dragStartY

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true

  if (dragMode === 'rotate') {
    yaw += dx * 0.006
    pitch = clamp(pitch + dy * 0.006, -1.45, 1.45)
  } else {
    const panScale = distance * 0.0018
    const viewDir = cameraTarget.clone().sub(camera.position).normalize()
    const right = new THREE.Vector3().crossVectors(viewDir, camera.up).normalize()
    const up = camera.up.clone().normalize()
    const move = right.multiplyScalar(-dx * panScale).add(up.multiplyScalar(dy * panScale))
    cameraTarget.add(move)
  }

  dragStartX = event.clientX
  dragStartY = event.clientY

  updateCamera()
}

function onPointerUp(event: PointerEvent) {
  if (!isDragging) return
  const wasRotate = dragMode === 'rotate'
  isDragging = false
  dragMode = null
  if (!dragMoved && wasRotate && event.button === 0) handlePick(event.clientX, event.clientY)
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  distance = clamp(distance + event.deltaY * 0.0015, 1.4, 4)
  updateCamera()
}

function onResize() {
  if (!canvasHost.value || !renderer || !camera) return
  const w = canvasHost.value.clientWidth
  const h = canvasHost.value.clientHeight
  if (!w || !h) return
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  requestRender()
}

function onContextMenu(event: MouseEvent) {
  event.preventDefault()
}

function makeAxisLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 96, 96)
    ctx.beginPath()
    ctx.arc(48, 48, 33, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(16, 16, 18, 0.8)'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 40px Sora, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 4
    ctx.fillText(text, 48, 51)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
  axisLabelMaterials.push(material)

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(0.24, 0.24, 0.24)
  return sprite
}

function initAxisGizmo() {
  if (!axisHost.value) return

  axisScene = new THREE.Scene()
  axisCamera = new THREE.PerspectiveCamera(36, 1, 0.01, 20)
  axisCamera.position.set(0, 0, 3.35)
  axisCamera.lookAt(0, 0, 0)

  axisRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  axisRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  const w = Math.max(1, axisHost.value.clientWidth)
  const h = Math.max(1, axisHost.value.clientHeight)
  axisRenderer.setSize(w, h)
  axisHost.value.innerHTML = ''
  axisHost.value.appendChild(axisRenderer.domElement)

  axisRoot = new THREE.Group()
  axisScene.add(axisRoot)

  const origin = new THREE.Vector3(0, 0, 0)
  const axes = [
    { label: 'R', dir: new THREE.Vector3(0, 0, 1), color: 0xff4f4f },
    { label: 'G', dir: new THREE.Vector3(0, 1, 0), color: 0x35c36a },
    { label: 'B', dir: new THREE.Vector3(1, 0, 0), color: 0x4f8bff },
  ]

  for (const axis of axes) {
    const length = 0.78
    const arrow = new THREE.ArrowHelper(axis.dir, origin, length, axis.color, 0.22, 0.12)
    axisRoot.add(arrow)
    const tip = axis.dir.clone().multiplyScalar(length + 0.18)
    const label = makeAxisLabel(axis.label, `#${axis.color.toString(16).padStart(6, '0')}`)
    label.position.copy(tip)
    axisRoot.add(label)
  }

  renderAxisGizmo()
}

function renderAxisGizmo() {
  if (!axisRenderer || !axisScene || !axisCamera || !axisRoot || !camera) return
  axisRoot.quaternion.copy(camera.quaternion).invert()
  axisRenderer.render(axisScene, axisCamera)
}

function teardownAxisGizmo() {
  axisLabelMaterials.forEach(mat => {
    mat.map?.dispose()
    mat.dispose()
  })
  axisLabelMaterials = []
  axisRenderer?.dispose()
  axisRenderer = null
  axisScene = null
  axisCamera = null
  axisRoot = null
}

function initScene() {
  if (!canvasHost.value) return

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(46, 1, 0.01, 50)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  canvasHost.value.innerHTML = ''
  canvasHost.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambient)

  cubeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uLevels: { value: Math.max(2, resolution.value) },
    },
    vertexShader: `
      varying vec3 vRgbNorm;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        // Axis mapping is flipped: R from Z, G from Y, B from X.
        vRgbNorm = clamp(vec3(worldPos.z + 0.5, worldPos.y + 0.5, worldPos.x + 0.5), 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uLevels;
      varying vec3 vRgbNorm;
      void main() {
        float levels = max(uLevels, 2.0);
        vec3 quantized = floor(vRgbNorm * (levels - 1.0) + 0.5) / (levels - 1.0);
        gl_FragColor = vec4(quantized, 1.0);
      }
    `,
  })

  cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial)
  scene.add(cubeMesh)

  cubeWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeMesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.35 }),
  )
  scene.add(cubeWire)

  markerRingDark = new THREE.Mesh(
    new THREE.RingGeometry(0.024, 0.048, 36),
    new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide, depthTest: false }),
  )
  markerRingDark.renderOrder = 10
  scene.add(markerRingDark)

  markerRingLight = new THREE.Mesh(
    new THREE.RingGeometry(0.018, 0.04, 36),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthTest: false }),
  )
  markerRingLight.renderOrder = 11
  scene.add(markerRingLight)

  raycaster = new THREE.Raycaster()
  ndcPointer = new THREE.Vector2()

  updateCubeShape()
  setMarkerFromHex(selectedHex.value)
  resetCamera()
  initAxisGizmo()
  onResize()

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
  renderer.domElement.addEventListener('contextmenu', onContextMenu)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('resize', onResize)

  if (canvasHost.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => onResize())
    resizeObserver.observe(canvasHost.value)
  }
}

function teardown() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }

  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('wheel', onWheel)
    renderer.domElement.removeEventListener('contextmenu', onContextMenu)
  }

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
  resizeObserver = null

  disposeCubeGeometry()
  cubeMaterial?.dispose()

  markerRingLight?.geometry.dispose()
  ;(markerRingLight?.material as THREE.Material | undefined)?.dispose()

  markerRingDark?.geometry.dispose()
  ;(markerRingDark?.material as THREE.Material | undefined)?.dispose()

  if (cubeWire?.material && cubeWire.material instanceof THREE.Material) {
    cubeWire.material.dispose()
  }

  teardownAxisGizmo()
  renderer?.dispose()
}

function onResolutionInput(event: Event) {
  const next = clamp(parseInt((event.target as HTMLInputElement).value) || 255, 3, 255)
  if (next === resolution.value) return

  const rRatio = cutR.value / Math.max(1, resolution.value - 1)
  const gRatio = cutG.value / Math.max(1, resolution.value - 1)
  const bRatio = cutB.value / Math.max(1, resolution.value - 1)

  resolution.value = next
  cutR.value = Math.round(rRatio * (next - 1))
  cutG.value = Math.round(gRatio * (next - 1))
  cutB.value = Math.round(bRatio * (next - 1))
}

function onCutInput(axis: Axis, event: Event) {
  const next = clamp(parseInt((event.target as HTMLInputElement).value) || 0, 0, resolution.value - 1)
  if (axis === 'r') cutR.value = next
  if (axis === 'g') cutG.value = next
  if (axis === 'b') cutB.value = next
}

function setCutsFromHex(hex: string) {
  const [r, g, b] = parseHex(hex)
  const [nextR, nextG, nextB] = ensureTwoNonZeroCuts(
    channelToIdx(r, resolution.value),
    channelToIdx(g, resolution.value),
    channelToIdx(b, resolution.value),
  )
  cutR.value = nextR
  cutG.value = nextG
  cutB.value = nextB
}

watch([resolution, cutR, cutG, cutB], () => {
  updateCubeShape()
})

watch(
  () => props.hex,
  hex => {
    const next = hex.replace('#', '').toUpperCase()
    selectedHex.value = next
    if (skipAutoSliceForHex === next) {
      skipAutoSliceForHex = null
    } else {
      setCutsFromHex(next)
    }
    setMarkerFromHex(next)
  },
  { immediate: true },
)

onMounted(() => {
  try {
    initScene()
  } catch {
    loadError.value = '3D selector could not load in this environment.'
  }
})

onUnmounted(() => {
  teardown()
})
</script>
<style scoped src="./RgbCube3DPicker.css"></style>
