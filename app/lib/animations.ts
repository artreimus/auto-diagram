// Animation configurations - inspired by Apple's fluid motion
export const springConfig = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 16,
  mass: 0.8,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8 },
};

export const fadeInUpDelayed = (delay: number = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.6, delay },
});

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const staggeredFadeInScale = (index: number, baseDelay: number = 0) => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, delay: baseDelay + index * 0.1 },
});

export const chartRevealAnimation = (
  index: number,
  baseDelay: number = 0.6
) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.7,
    delay: baseDelay + index * 0.2,
  },
});
