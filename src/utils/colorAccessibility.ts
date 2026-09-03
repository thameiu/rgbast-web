import { rgbToHex } from './paletteColorFormats'

export type DaltonismMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

const SHARK_TALE_QUOTES = [
  "I'm the shark slayer!",
  'Whale Wash. You get the whale, we do the rest.',
  "I'm a vegetarian.",
  "Don't you EVER take the last meatball!",
  'Oscar, I am your father.',
  'Thank you, fish!',
  'I got jelly in my head.',
  'Man, it is good to be alive!',
  'I just wanna be somebody.',
  'Keep it real, keep it real.',
  'You are so beautiful!',
  'Sykes, you beautiful fish!',
  'Sorry, pop. Lenny had a little accident. He was born!',
  'You live in a billboard? And I thought I was crazy!',
  'You coming at me like that? You come at the O like that?',
  'No, I said "What, what?" as in "What, what?',
  'Well, for your information, I am the Sharkslayer.',
  "That's what I'm talking about!",
  "You're killing me, Smalls!",
  'Just keep swimming, keep swimming.',
  "I'm the best there ever was!",
  'Nobody does it better than Oscar.',
  'Stay in school, kids.',
  "Mama's gonna make it all better.",
  "That's not how we do things around here.",
  'You gotta believe in yourself!',
  "I didn't come this far to give up now.",
  "That's hot, that's hot.",
  'Angler fish? More like danger fish!',
  'Plankton power!',
  "I've got big dreams, baby.",
  'This is my moment!',
  "Don't mess with the coral.",
  'Jellyfish jam session!',
  'Living large in the reef!',
  "That's a wrap, my fins.",
  'You feel me?',
  "I'm on top of the world!",
  'Legends never die.',
  'Keep your head in the game.',
  "That's the way the cookie crumbles.",
  "I'm bout to blow up!",
  'Fame is a funny thing.',
  'Money talks, you know?',
  'Friends forever, no matter what.',
  "That's just how we roll.",
  "I'm living my best life.",
  'Dreams do come true!',
  'Never give up, never surrender.',
  "That's the real deal right there.",
  "You've got potential, kid.",
  'This is gonna be legendary.',
  "I'm ready for anything!",
  "That's the ticket!",
  'Keep shining, bright star.',
  "We're in this together, buddy.",
  "That's a certified banger right there.",
] as const

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function applyDaltonismMatrix(
  rgb: { r: number; g: number; b: number },
  matrix: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]],
): string {
  const nr = clampByte(rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2])
  const ng = clampByte(rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2])
  const nb = clampByte(rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2])
  return rgbToHex(nr, ng, nb)
}

export function applyDaltonismToHex(
  hex: string,
  rgb: { r: number; g: number; b: number },
  mode: DaltonismMode,
): string {
  if (mode === 'none') return hex.toUpperCase()

  if (mode === 'protanopia') {
    return applyDaltonismMatrix(rgb, [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758],
    ])
  }

  if (mode === 'deuteranopia') {
    return applyDaltonismMatrix(rgb, [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7],
    ])
  }

  if (mode === 'achromatopsia') {
    const gray = clampByte(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b)
    return rgbToHex(gray, gray, gray)
  }

  return applyDaltonismMatrix(rgb, [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ])
}

export function getSharkTaleQuote(hex: string): string {
  const normalized = hex.replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(normalized.slice(0, 4), 16)
  return SHARK_TALE_QUOTES[n % SHARK_TALE_QUOTES.length] ?? SHARK_TALE_QUOTES[0]
}
