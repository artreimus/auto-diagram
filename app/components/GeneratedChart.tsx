'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import MermaidDiagram from './MermaidDiagram';
import { mermaidSchema } from '@/app/api/mermaid/schema';
import { ChartPlan } from '@/app/api/planner/schema';
import { DeepPartial } from 'ai';
import { useEffect } from 'react';

// Refined loading spinner for chart generation
const ChartLoadingSpinner = () => (
  <div
    className='flex items-center justify-center space-x-1'
    role='status'
    aria-live='polite'
    aria-label='Generating chart'
  >
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className='w-1 h-1 bg-monochrome-silver rounded-full'
        animate={{
          opacity: [0.3, 1, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: index * 0.15,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

export function GeneratedChart({ plan }: { plan: DeepPartial<ChartPlan> }) {
  const {
    object: chart,
    error,
    submit,
    isLoading,
  } = useObject({
    api: '/api/mermaid',
    schema: mermaidSchema,
  });

  useEffect(() => {
    if (plan.type && plan.description && !isLoading && !chart) {
      submit({
        messages: [{ role: 'user', content: plan.description }],
        chartType: plan.type,
      });
    }
  }, [plan.type, plan.description, submit, isLoading, chart]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl p-6 backdrop-blur-sm'
        role='alert'
      >
        <div className='flex items-start space-x-3'>
          <div className='w-1.5 h-1.5 bg-monochrome-ash rounded-full mt-2 flex-shrink-0' />
          <div>
            <p className='text-monochrome-cloud font-medium mb-1'>
              Chart generation encountered an issue
            </p>
            <p className='text-sm text-monochrome-silver font-light'>
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-3xl p-8 backdrop-blur-sm shadow-soft'
    >
      {/* Chart header - refined typography */}
      <div className='mb-8'>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className='text-xl font-light tracking-tight text-monochrome-pure-white capitalize mb-3'
        >
          {chart?.type ?? plan.type ?? 'Chart'} Visualization
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className='text-monochrome-silver font-light leading-relaxed text-sm tracking-wide'
        >
          {chart?.description ??
            plan.description ??
            'Preparing visualization...'}
        </motion.p>
      </div>

      {/* Chart content or loading state */}
      {chart?.chart ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <MermaidDiagram
            id={nanoid()}
            chart={chart.chart}
            chartType={chart.type || plan.type}
            description={chart.description || plan.description}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className='flex flex-col items-center justify-center py-24 min-h-[280px]'
        >
          <ChartLoadingSpinner />
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className='mt-6 text-monochrome-silver font-light tracking-wide text-sm'
          >
            Generating visualization
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}
