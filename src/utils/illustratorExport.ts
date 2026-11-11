/**
 * Legacy Illustrator 3 vector syntax (Adobe's public 1998 AI specification).
 * Rectangles remain paths and text remains editable. No modern private AI data
 * or embedded fonts are generated; the target machine must have the fonts.
 */
export function svgToLegacyIllustrator(svg: string): string {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = document.documentElement
  const [, , width = 1, height = 1] = (root.getAttribute('viewBox') ?? '').split(/\s+/).map(Number)
  const pageWidth = width > height ? 841.89 : 595.28
  const scale = pageWidth / width, pageHeight = width > height ? 595.28 : 841.89
  const n = (value: number) => Number(value.toFixed(4))
  const x = (value: number) => n(value * scale)
  const y = (value: number) => n((height - value) * pageHeight / height)
  const lines = [
    '%!PS-Adobe-3.0 EPSF-3.0', '%%Creator: RGBAST',
    '%%BoundingBox: 0 0 ' + Math.ceil(pageWidth) + ' ' + Math.ceil(pageHeight),
    '%%HiResBoundingBox: 0 0 ' + n(pageWidth) + ' ' + n(pageHeight),
    '%%DocumentNeededResources: procset Adobe_Illustrator_AI3 1.0 0',
    '%%DocumentSuppliedResources: procset Adobe_Illustrator_AI3 1.0 0',
    '%AI3_ColorUsage: Color', '%AI3_DocumentPreview: None', '%%EndComments',
    '%%BeginProlog', '%%BeginResource: procset Adobe_Illustrator_AI3 1.0 0',
    '/m {moveto} bind def /l {lineto} bind def /c {curveto} bind def',
    '/f {closepath fill} bind def /k {setcmykcolor} bind def',
    '/To {pop gsave} bind def /TO {grestore} bind def',
    '/Tp {pop 6 array astore concat 0 0 moveto} bind def /TP {} bind def',
    '/Tf {exch findfont exch scalefont setfont} bind def /Tx {show} bind def',
    '%%EndResource', '%%EndProlog', '%%BeginSetup', '%%EndSetup',
  ]
  const literal = (text: string) => '(' + Array.from(text).map(char => {
    const code = char.charCodeAt(0)
    if ('()\\'.includes(char)) return '\\' + char
    if (code >= 32 && code <= 126) return char
    return code <= 255 ? '\\' + code.toString(8).padStart(3, '0') : '?'
  }).join('') + ')'
  for (const element of Array.from(root.children)) {
    const read = (name: string, fallback = 0) => Number(element.getAttribute(name) ?? fallback)
    const fill = element.getAttribute('fill') ?? '#000000'
    const rgb = fill.startsWith('#')
      ? [1, 3, 5].map(offset => parseInt(fill.slice(offset, offset + 2), 16) / 255)
      : (fill.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(v => Number(v) / 255)
    const [r = 0, g = 0, b = 0] = rgb, black = 1 - Math.max(r, g, b)
    const cmyk = black >= 1 ? [0, 0, 0, 1] : [(1-r-black)/(1-black), (1-g-black)/(1-black), (1-b-black)/(1-black), black]
    lines.push(cmyk.map(n).join(' ') + ' k')
    if (element.tagName === 'rect') {
      const left=read('x'),top=read('y'),w=read('width'),h=read('height')
      const radius=Math.min(read('rx'),w/2,h/2),a=radius*.5522847498
      const move=(px:number,py:number)=>lines.push(x(px)+' '+y(py)+' m')
      const line=(px:number,py:number)=>lines.push(x(px)+' '+y(py)+' l')
      const curve=(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number)=>lines.push([x(x1),y(y1),x(x2),y(y2),x(x3),y(y3)].join(' ')+' c')
      move(left+radius,top);line(left+w-radius,top)
      curve(left+w-radius+a,top,left+w,top+radius-a,left+w,top+radius)
      line(left+w,top+h-radius);curve(left+w,top+h-radius+a,left+w-radius+a,top+h,left+w-radius,top+h)
      line(left+radius,top+h);curve(left+radius-a,top+h,left,top+h-radius+a,left,top+h-radius)
      line(left,top+radius);curve(left,top+radius-a,left+radius-a,top,left+radius,top)
      lines.push('f')
    } else if (element.tagName === 'text') {
      const text=element.textContent??'',size=read('font-size',12),bold=read('font-weight',400)>=600
      const family=(element.getAttribute('font-family')??'Inter').split(',')[0]!.replace(/[^a-zA-Z0-9-]/g,'')
      // Use the requested PostScript font name; Illustrator substitutes missing fonts.
      const font=family+(bold?'-Bold':'-Regular')
      let left=read('x')
      if(element.getAttribute('text-anchor')==='end'){
        const ctx=window.document.createElement('canvas').getContext('2d')!
        ctx.font=(bold?'700 ':'400 ')+size+'px "'+family+'"'
        left-=ctx.measureText(text).width
      }
      lines.push('0 To','1 0 0 1 '+x(left)+' '+y(read('y'))+' 0 Tp','TP','/'+font+' '+x(size)+' Tf',literal(text)+' Tx','TO')
    }
  }
  lines.push('%%Trailer','showpage','%%EOF')
  return lines.join('\n')+'\n'
}
