'use client';

import { motion } from 'framer-motion';
import { BouncingDotsLoader } from './BouncingDotsLoader';
import { ResultStatus } from '../enum/session';

interface ProcessingStateProps {
  isPlanning: boolean;
}

export const ProcessingState = ({ isPlanning }: ProcessingStateProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className='flex items-center justify-center py-8'
  >
    <div className='flex items-center space-x-4'>
      <BouncingDotsLoader />
      <span className='text-monochrome-silver font-light tracking-wide'>
        {isPlanning ? ResultStatus.PLANNING : ResultStatus.GENERATING}
      </span>
    </div>
  </motion.div>
);
