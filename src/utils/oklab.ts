export type Lab = [number, number, number]
export function rgbToOklab(r:number,g:number,b:number):Lab {
  const linear=(v:number)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
  r=linear(r);g=linear(g);b=linear(b)
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b)
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b)
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b)
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]
}
export function hexToOklab(hex:string):Lab{return rgbToOklab(...([0,2,4].map(i=>parseInt(hex.replace('#','').slice(i,i+2),16)) as Lab))}
export function oklabToHex([L,a,b]:Lab):string {
  const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3
  const encode=(v:number)=>Math.round(Math.max(0,Math.min(1,v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))*255).toString(16).padStart(2,'0')
  return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(encode).join('').toUpperCase()
}
// Same bases and exceptions as bast_index_2_1.pdf; each category has one vote.
export const bastReferences = ['FFFFFF','000000','929591','E50000','F97306','FFFF14','15B01A','00FFFF','0343DF','7E1E9C','C20078','FF81C0','653700'].flatMap((hex,index)=>{
  const base=hexToOklab(hex)
  if([0,1,2,12].includes(index))return [{hex,lab:base}]
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),max=Math.max(...rgb)
  if(max===255)return [{hex,lab:base}]
  const vivid=rgbToOklab(...(rgb.map(v=>v*255/max) as Lab)),mid=base.map((v,i)=>(v+vivid[i]!)/2) as Lab
  return [base,mid,vivid].map(lab=>({hex:oklabToHex(lab),lab}))
})
