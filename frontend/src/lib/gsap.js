import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function fadeInUp(el, delay = 0) {
  gsap.fromTo(
    el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay,
      ease: 'power2.out',
    }
  );
}

export function staggerReveal(els, delay = 0, stagger = 0.1) {
  gsap.fromTo(
    els,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay,
      stagger,
      ease: 'power2.out',
    }
  );
}

export function parallaxScroll(el, speed = 0.5) {
  gsap.to(el, {
    y: () => window.innerHeight * speed * -1,
    scrollTrigger: {
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      scrub: 1,
      markers: false,
    },
  });
}

export function pinSection(el, duration = 3) {
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top top',
      end: `+=${window.innerHeight * duration}`,
      pin: true,
      scrub: 1,
      markers: false,
    },
  });
}

export function textReveal(el) {
  gsap.fromTo(
    el,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        end: 'top 20%',
        scrub: 1,
      },
    }
  );
}

export { gsap, ScrollTrigger };
