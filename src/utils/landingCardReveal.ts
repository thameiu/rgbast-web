import gsap from 'gsap'

export function createLandingCardReveal(cards: HTMLElement[] | NodeListOf<HTMLElement>, reduced: boolean) {
  gsap.set(cards, { autoAlpha: 0, xPercent: -50, yPercent: 0, rotation: 0 })
  return gsap.timeline({ paused: true }).to(cards, {
    autoAlpha: 1,
    xPercent: (index) => [-105, -50, 5][index % 3]!,
    yPercent: (index) => [-140, -190, -145][index % 3]!,
    rotation: (index) => [-14, 2, 14][index % 3]!,
    duration: reduced ? 0.001 : 0.65,
    stagger: reduced ? 0 : 0.06,
    ease: 'power3.out',
  })
}
