<template>
  <div class="cube-wrap">
    <div class="cube-actions">
      <button class="camera-reset-btn" @click="reset">{{ t('colorPage.cube3d.resetCamera') }}</button>
      <button class="camera-reset-btn" @click="resetScales">{{ t('colorPage.cube3d.resetScales') }}</button>
      <button class="camera-reset-btn" :aria-pressed="showReferences" @click="showReferences=!showReferences; render()">{{ t('oklab.references') }}</button>
    </div>
    <div class="ctrl-grid">
      <div v-for="axis in axes" :key="axis.key" class="ctrl">
        <label :for="'lab-cut-'+axis.key">{{ axis.label }}</label>
        <input :id="'lab-cut-'+axis.key" type="range" :min="axis.min" :max="axis.max" step=".005" v-model.number="cuts[axis.key]" @input="render" />
        <span>{{ cuts[axis.key].toFixed(3) }}</span>
      </div>
    </div>
    <div class="cube-canvas-shell"><div ref="host" class="cube-canvas" @contextmenu.prevent></div></div>
    <p class="cube-hint">{{ t('oklab.hint') }}</p>
    <p v-if="error" class="cube-error" role="alert">{{ error }}</p>
    <p class="cube-picked">{{ t('colorPage.cube3d.selected') }} <strong>#{{ hex }}</strong></p>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { bastReferences, hexToOklab, rgbToOklab, oklabToHex, type Lab } from '@/utils/oklab'
import { useI18n } from '@/i18n'
const props = defineProps<{hex:string}>()
const emit = defineEmits<{pick:[hex:string]}>()
const {t} = useI18n()
const host = ref<HTMLElement|null>(null), showReferences = ref(true), error = ref('')
const cuts = reactive({L:1,a:.4,b:.4})
const axes = [{key:'L',label:'L',min:0,max:1},{key:'a',label:'a',min:-.4,max:.4},{key:'b',label:'b',min:-.4,max:.4}] as const
let renderer:any, scene:any, camera:any, mesh:any, marker:any, refs:any
let axisScene:any, axisCamera:any, observer:ResizeObserver|undefined, frame=0
const planes=[new THREE.Plane(new THREE.Vector3(0,-1,0),.5),new THREE.Plane(new THREE.Vector3(-1,0,0),.8),new THREE.Plane(new THREE.Vector3(0,0,-1),.8)]
let yaw=.8,pitch=.4,distance=2.4
const target=new THREE.Vector3()
const pointers=new Map<number,{x:number;y:number}>()
let moved=false, travel=0
function position(lab:Lab){return new THREE.Vector3(lab[1]*2,lab[0]-.5,lab[2]*2)}
function visible(point:any){return planes.every(plane=>plane.distanceToPoint(point)>=-1e-5)}
function render(){
  if(!renderer)return
  cancelAnimationFrame(frame)
  frame=requestAnimationFrame(()=>{
    planes[0]!.constant=cuts.L-.5;planes[1]!.constant=cuts.a*2;planes[2]!.constant=cuts.b*2
    refs.visible=showReferences.value
    refs.children.forEach((child:any)=>{child.visible=visible(child.position)})
    marker.position.copy(position(hexToOklab(props.hex)))
    camera.position.set(target.x+distance*Math.cos(pitch)*Math.cos(yaw),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(pitch)*Math.sin(yaw))
    camera.lookAt(target)
    const w=host.value!.clientWidth,h=host.value!.clientHeight
    renderer.setViewport(0,0,w,h);renderer.clear();renderer.render(scene,camera)
    axisCamera.position.copy(camera.position).sub(target).normalize().multiplyScalar(3)
    axisCamera.up.copy(camera.up);axisCamera.lookAt(0,0,0)
    renderer.clearDepth();renderer.setViewport(6,6,100,100);renderer.render(axisScene,axisCamera);renderer.setViewport(0,0,w,h)
  })
}
function reset(){yaw=.8;pitch=.4;distance=2.4;target.set(0,0,0);render()}
function resetScales(){Object.assign(cuts,{L:1,a:.4,b:.4});render()}
function down(e:PointerEvent){if(e.button!==0&&e.button!==2)return;e.preventDefault();host.value!.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){moved=false;travel=0}else moved=true}
function move(e:PointerEvent){
  const p=pointers.get(e.pointerId);if(!p)return
  e.preventDefault()
  const dx=e.clientX-p.x,dy=e.clientY-p.y;travel+=Math.abs(dx)+Math.abs(dy);if(travel>4)moved=true
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})
  if(e.buttons===2||pointers.size>1){target.addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),-dx*.002*distance);target.addScaledVector(new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion),dy*.002*distance)}
  else{yaw-=dx*.007;pitch=Math.max(-1.4,Math.min(1.4,pitch+dy*.007))}
  render()
}
function up(e:PointerEvent){
  if(!pointers.has(e.pointerId))return
  pointers.delete(e.pointerId)
  if(moved||e.type==='pointercancel'||e.button===2)return
  const rect=host.value!.getBoundingClientRect(),ray=new THREE.Raycaster()
  if(e.clientX-rect.left<112&&rect.bottom-e.clientY<112)return
  ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera)
  const hit=ray.intersectObjects(showReferences.value?[refs,mesh]:[mesh],true).find((h:any)=>h.object.visible&&visible(h.point))
  if(hit)emit('pick',hit.object.userData.hex??oklabToHex([hit.point.y+.5,hit.point.x/2,hit.point.z/2]))
}
function wheel(e:WheelEvent){e.preventDefault();distance=Math.max(1,Math.min(5,distance+e.deltaY*.002));render()}
function resize(){if(!host.value||!renderer)return;const w=host.value.clientWidth,h=host.value.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render()}
onMounted(()=>{try{
  scene=new THREE.Scene();axisScene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,1,.01,20);axisCamera=new THREE.PerspectiveCamera(42,1,.01,10)
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.autoClear=false;renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.value!.appendChild(renderer.domElement)
  const geometry=new THREE.BoxGeometry(255,255,255,28,28,28),positions=geometry.attributes.position!,colors:number[]=[]
  for(let i=0;i<positions.count;i++){const r=positions.getX(i)+127.5,g=positions.getY(i)+127.5,b=positions.getZ(i)+127.5,point=position(rgbToOklab(r,g,b));positions.setXYZ(i,point.x,point.y,point.z);const color=new THREE.Color().setRGB(r/255,g/255,b/255,THREE.SRGBColorSpace);colors.push(color.r,color.g,color.b)}
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere()
  mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,clippingPlanes:planes}));scene.add(mesh)
  refs=new THREE.Group()
  for(const reference of bastReferences){const sphere=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),new THREE.MeshBasicMaterial({color:'#'+reference.hex,depthTest:false}));sphere.position.copy(position(reference.lab));sphere.userData.hex=reference.hex;sphere.renderOrder=2;refs.add(sphere)}
  scene.add(refs);marker=new THREE.Group()
  for(const [radius,color] of [[.022,0x000000],[.016,0xffffff]]){const ring=new THREE.Mesh(new THREE.SphereGeometry(radius,16,10),new THREE.MeshBasicMaterial({color,wireframe:true,depthTest:false}));ring.renderOrder=3;marker.add(ring)}scene.add(marker)
  for(const [label,dir,color] of [['a',new THREE.Vector3(1,0,0),0xe84f72],['L',new THREE.Vector3(0,1,0),0x777777],['b',new THREE.Vector3(0,0,1),0xc9ad20]] as const){
    axisScene.add(new THREE.ArrowHelper(dir,new THREE.Vector3(),.65,color,.15,.08))
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96
    const ctx=canvas.getContext('2d')!;ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle='#fff';ctx.strokeText(label,48,48);ctx.fillStyle='#111';ctx.fillText(label,48,48)
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.position.copy(dir.clone().multiplyScalar(.9));sprite.scale.set(.4,.4,1);axisScene.add(sprite)
  }
  const el=host.value!;el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});observer=new ResizeObserver(resize);observer.observe(el);resize()
}catch{error.value=t('colorPage.cube3d.loadError')}})
watch(()=>props.hex,render)
onBeforeUnmount(()=>{
  cancelAnimationFrame(frame);observer?.disconnect()
  const el=host.value;el?.removeEventListener('pointerdown',down);el?.removeEventListener('pointermove',move);el?.removeEventListener('pointerup',up);el?.removeEventListener('pointercancel',up);el?.removeEventListener('wheel',wheel)
  for(const root of [scene,axisScene])root?.traverse((object:any)=>{const item=object;item.geometry?.dispose();const materials=Array.isArray(item.material)?item.material:[item.material];materials.forEach((material:any)=>{material?.map?.dispose();material?.dispose()})})
  renderer?.dispose()
})
</script>
<style scoped src="./RgbCube3DPicker.css"></style>
