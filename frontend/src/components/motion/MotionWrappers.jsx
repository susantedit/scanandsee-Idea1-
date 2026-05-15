import React from 'react';
import { motion } from 'framer-motion';

// Motion wrapper for staggered children
export function StaggerContainer({ children, delay = 0, className = '' }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  );
}

// Fade-in item (for use inside StaggerContainer)
export function FadeInItem({ children, className = '' }) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Slide-in from left
export function SlideInFromLeft({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale up on view
export function ScaleOnView({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-50px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover scale
export function HoverScale({ children, scale = 1.05, className = '' }) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Glow on hover (for buttons/cards)
export function GlowOnHover({ children, className = '', glowColor = 'rgba(0, 238, 252, 0.3)' }) {
  return (
    <motion.div
      whileHover={{ boxShadow: `0 0 30px ${glowColor}` }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
