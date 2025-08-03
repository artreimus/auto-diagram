'use client';

import { motion } from 'framer-motion';

interface MinimalLoadingSpinnerProps {
  className?: string;
}

export const BouncingDotsLoader = ({
  className = '',
}: MinimalLoadingSpinnerProps) => (
  <div
    className={`flex items-center justify-center space-x-1 ${className}`}
    role='status'
    aria-live='polite'
    aria-label='Planning charts'
  >
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className='w-0.5 h-0.5 bg-monochrome-pure-white rounded-full'
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: index * 0.2,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);
