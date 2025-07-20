'use client';

import { motion } from 'framer-motion';

interface ErrorStateProps {
  message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className='mb-8 p-6 border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl backdrop-blur-sm'
  >
    <p className='text-monochrome-cloud font-medium'>{message}</p>
  </motion.div>
);
