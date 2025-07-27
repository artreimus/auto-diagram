'use client';

import { motion } from 'framer-motion';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import { ChartPlan } from '@/app/api/planner/schema';
import { mermaidSchema } from '@/app/api/mermaid/schema';
import { ResultStatus } from '../enum/session';

// Enhanced props with AI SDK pattern context
interface GeneratedChartProps {
  chartStatus: {
    plan: ChartPlan;
    status: ResultStatus;
    chart?: string;
    isGenerating: boolean;
    isFixing: boolean;
    error?: Error | null;
    retryCount: number;
    mermaidResult?: unknown;
    fixResult?: unknown;
    canFix: boolean;
    fixError?: string;
  };
  planId: number;
  onRenderError: (planId: number, error: string) => void;
  onFixComplete?: () => void;
  originalUserMessage: string;
}

export function GeneratedChart({
  chartStatus,
  planId,
  onRenderError,
  onFixComplete,
  originalUserMessage,
}: GeneratedChartProps) {
  const {
    plan,
    status,
    chart,
    isGenerating,
    error,
    retryCount,
    canFix,
    mermaidResult,
  } = chartStatus;

  // Pattern 3: Individual fix hook per chart component
  const fixHook = useObject({
    api: '/api/mermaid/fix',
    schema: mermaidSchema,
    onFinish: () => {
      if (onFixComplete) {
        onFixComplete();
      }
    },
  });

  // Handle manual fix trigger
  const handleManualFix = () => {
    const result = mermaidResult as
      | { error?: string; chart?: { chart?: string } }
      | undefined;
    if (result?.error && !fixHook.isLoading) {
      fixHook.submit({
        chart: result.chart?.chart || '',
        error: result.error,
        chartType: plan.type,
        description: plan.description,
        originalUserMessage: originalUserMessage,
        planDescription: plan.description,
        previousAttempts: [],
      });
    }
  };

  // Use fix result if available, otherwise use original chart
  const displayChart = fixHook.object?.chart || chart;
  const isFixing = fixHook.isLoading;
  const currentFixError = fixHook.error?.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-3xl p-8 backdrop-blur-sm shadow-soft'
    >
      {/* Chart header */}
      <div className='mb-8'>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className='text-xl font-light tracking-tight text-monochrome-pure-white capitalize mb-3'
        >
          {plan.type ?? 'Chart'} Visualization
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className='text-monochrome-silver font-light leading-loose text-sm tracking-wide prose prose-sm prose-invert max-w-none'
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className='mb-3 last:mb-0 leading-loose'>{children}</p>
              ),
              strong: ({ children }) => (
                <strong className='font-medium text-monochrome-cloud'>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className='italic text-monochrome-pearl'>{children}</em>
              ),
              code: ({ children }) => (
                <code className='bg-monochrome-graphite/50 px-1.5 py-0.5 rounded text-monochrome-pearl font-mono text-xs'>
                  {children}
                </code>
              ),
              ul: ({ children }) => (
                <ul className='list-disc list-inside space-y-1.5 mb-3'>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className='list-decimal list-inside space-y-1.5 mb-3'>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className='text-sm leading-loose'>{children}</li>
              ),
              h1: ({ children }) => (
                <h1 className='text-lg font-medium text-monochrome-pure-white mb-3 mt-4 first:mt-0'>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className='text-base font-medium text-monochrome-pure-white mb-2 mt-3 first:mt-0'>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className='text-sm font-medium text-monochrome-cloud mb-2 mt-3 first:mt-0'>
                  {children}
                </h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className='border-l-2 border-monochrome-pewter/30 pl-4 italic text-monochrome-silver/90 mb-3'>
                  {children}
                </blockquote>
              ),
            }}
          >
            {plan.description || 'Preparing visualization...'}
          </ReactMarkdown>
        </motion.div>
      </div>

      {/* Chart content with manual fix controls */}
      {displayChart ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <MermaidDiagram
            id={`chart-${planId}`}
            chart={displayChart}
            onRenderError={(error) => onRenderError(planId, error)}
          />
        </motion.div>
      ) : status === 'error' && canFix ? (
        // Error state with manual fix button
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className='border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl p-6 backdrop-blur-sm'
        >
          <div className='flex items-start space-x-3 mb-4'>
            <div className='w-1.5 h-1.5 bg-monochrome-ash rounded-full mt-2 flex-shrink-0' />
            <div className='flex-1'>
              <p className='text-monochrome-cloud font-medium mb-1'>
                Chart generation failed
              </p>
              <p className='text-sm text-monochrome-silver font-light mb-4'>
                {error?.message || 'Unknown error occurred during generation'}
              </p>

              {/* Manual Fix Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualFix}
                disabled={isFixing}
                className={`text-sm font-medium tracking-wide px-4 py-2 rounded-xl border transition-all duration-200 backdrop-blur-sm ${
                  isFixing
                    ? 'text-monochrome-ash border-monochrome-pewter/20 bg-monochrome-graphite/10 cursor-not-allowed'
                    : 'text-monochrome-pure-white hover:text-monochrome-cloud border-monochrome-silver/40 hover:border-monochrome-cloud/60 bg-monochrome-graphite/30 hover:bg-monochrome-slate-dark/40'
                }`}
              >
                {isFixing ? (
                  <span className='flex items-center space-x-2'>
                    <div className='w-3 h-3 border border-monochrome-ash border-t-transparent rounded-full animate-spin' />
                    <span>Fixing...</span>
                  </span>
                ) : (
                  `Try Fix${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`
                )}
              </motion.button>

              {/* Fix Error Display */}
              {currentFixError && (
                <div className='mt-4 p-3 bg-monochrome-graphite/20 rounded-xl'>
                  <p className='text-xs text-monochrome-silver'>
                    <span className='font-medium'>Fix failed:</span>{' '}
                    {currentFixError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        // Loading state
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className='flex flex-col items-center justify-center py-24 min-h-[280px]'
        >
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
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className='mt-6 text-monochrome-silver font-light tracking-wide text-sm'
          >
            {isGenerating
              ? 'Generating visualization'
              : isFixing
                ? 'Applying fix...'
                : 'Waiting for generation...'}
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}
