import Lenis from 'lenis';

let lenis = null;

export function initLenis() {
  if (typeof window === 'undefined') return null;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2,
  });

  // Raf loop
  let raf;
  function raf_loop(time) {
    lenis.raf(time);
    raf = requestAnimationFrame(raf_loop);
  }
  raf = requestAnimationFrame(raf_loop);

  return () => cancelAnimationFrame(raf);
}

export function getLenis() {
  return lenis;
}

export function scrollTo(target, options = {}) {
  if (lenis) {
    lenis.scrollTo(target, options);
  }
}
