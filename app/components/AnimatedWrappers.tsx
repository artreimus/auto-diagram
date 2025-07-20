'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { fadeInUp, fadeInUpDelayed, springConfig } from '@/app/lib/animations';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  hasSubmitted: boolean;
}

export const AnimatedInputContainer = ({
  children,
  className = '',
  hasSubmitted,
}: AnimatedContainerProps) => (
  <motion.div
    layout
    initial={false}
    animate={{
      minHeight: hasSubmitted ? 'auto' : 'calc(100vh - 72px)',
      paddingTop: hasSubmitted ? '72px' : '0px',
    }}
    transition={springConfig}
    className={`container mx-auto px-6 flex flex-col ${className}`}
  >
    <motion.div
      layout
      className={`${hasSubmitted ? '' : 'flex-1 flex items-center justify-center'}`}
    >
      <motion.div layout className='w-full max-w-2xl mx-auto'>
        {children}
      </motion.div>
    </motion.div>
  </motion.div>
);

interface LandingHeroProps {
  children: ReactNode;
}

export const LandingHero = ({ children }: LandingHeroProps) => (
  <motion.div
    initial={fadeInUp.initial}
    animate={fadeInUp.animate}
    transition={fadeInUp.transition}
    className='text-center mb-12'
  >
    {children}
  </motion.div>
);

interface ResultsSectionProps {
  children: ReactNode;
  show: boolean;
}

export const ResultsSection = ({ children, show }: ResultsSectionProps) => {
  const delayed = fadeInUpDelayed(0.1);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={delayed.initial}
          animate={delayed.animate}
          exit={delayed.exit}
          transition={delayed.transition}
          className='container mx-auto px-6 pb-16 pt-12'
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ChartGenerationSectionProps {
  children: ReactNode;
}

export const ChartGenerationSection = ({
  children,
}: ChartGenerationSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.4 }}
  >
    <h2 className='text-2xl font-light tracking-tight text-monochrome-pure-white mb-8'>
      Generated Charts
    </h2>
    <div className='grid gap-12'>{children}</div>
  </motion.div>
);
