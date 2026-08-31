declare module 'rgbaster' {
  export interface RgbasterOptions {
    ignore?: string[]
    scale?: number
    skipTransparentPixels?: boolean
  }

  export interface RgbasterColor {
    color: string
    count: number
  }

  export default function analyze(src: string, opts?: RgbasterOptions): Promise<RgbasterColor[]>
}
