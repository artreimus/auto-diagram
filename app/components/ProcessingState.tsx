'use client';

import { motion } from 'framer-motion';
import { BouncingDotsLoader } from './BouncingDotsLoader';
import { ResultStatus } from '../enum/session';

interface ProcessingStateProps {
  isPlanning: boolean;
}

export const ProcessingState = ({ isPlanning }: ProcessingStateProps) => {
  const status = isPlanning ? ResultStatus.PLANNING : ResultStatus.GENERATING;
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  const statusMessages = {
    [ResultStatus.PLANNING]:
      'Analyzing your request and planning visualizations...',
    [ResultStatus.GENERATING]: 'Creating beautiful Mermaid diagrams...',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='mb-8'
    >
      {/* Main processing card */}
      <div className='relative max-w-md'>
        {/* Glowing background effect */}
        <motion.div
          className='absolute inset-0 rounded-2xl bg-gradient-to-r from-monochrome-silver/20 to-monochrome-ash/20 blur-xl'
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main content */}
        <motion.div
          className='relative bg-monochrome-charcoal/90 backdrop-blur-xl border border-monochrome-pewter/30 rounded-2xl p-6 shadow-2xl'
          animate={{
            boxShadow: [
              '0 5px 10px rgba(255,255,255,0.1)',
              '0 5px 10px rgba(255,255,255,0.15)',
              '0 5px 10px rgba(255,255,255,0.1)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Main status */}
          <div className='flex items-center space-x-4 mb-3'>
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <BouncingDotsLoader />
            </motion.div>
            <motion.h3
              className='text-monochrome-pure-white font-medium tracking-tight text-lg'
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {displayText}
            </motion.h3>
          </div>

          {/* Detailed message */}
          <motion.p
            className='text-monochrome-silver/80 text-sm font-light leading-relaxed'
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {statusMessages[status]}
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
