import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { HeroScene } from './3d/HeroScene';
import Button from './ui/CinematicButton';
import Section from './layout/CinematicSection';
import { StaggerContainer, FadeInItem } from './motion/MotionWrappers';

export function CinematicHero() {
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <Section fullScreen heroGradient id="hero" className="flex items-center justify-center">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <HeroScene />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 container flex flex-col items-center justify-center text-center">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="font-grotesk font-bold text-5xl md:text-6xl mb-4">
            <span className="text-text-primary">Scan Your Food,</span>
            <br />
            <span className="bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent">
              Know Your Health
            </span>
          </h1>
        </motion.div>

        <StaggerContainer delay={0.3}>
          <FadeInItem>
            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mb-8">
              AI-powered nutrition analysis. Real-time health scoring. Cinematic insights.
            </p>
          </FadeInItem>

          <FadeInItem>
            <div className="flex gap-4 justify-center">
              <Button size="lg">Get Started</Button>
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </div>
          </FadeInItem>
        </StaggerContainer>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-cyan rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-0.5 h-2 bg-cyan rounded-full"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </Section>
  );
}

export default CinematicHero;
