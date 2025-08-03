'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import {
  MermaidChart,
  mermaidFixResponseSchema,
} from '@/app/api/mermaid/schema';
import { Plan } from '../api/planner/schema';
import { ChartVersion } from '@/app/validators/session';
import { ChartSource } from '@/app/enum/session';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';

interface GeneratedChartProps {
  id?: string;
  plan: Plan;
  chart: MermaidChart;
  chartIndex: number;
  isPlanning?: boolean;
  isGenerating?: boolean;
  versions?: ChartVersion[];
  currentVersionIndex?: number;
  onFixComplete: (
    chartIndex: number,
    fixedChart: string,
    rationale: string
  ) => void;
  onVersionChange?: (chartIndex: number, versionIndex: number) => void;
}

export function GeneratedChart({
  id,
  plan,
  chart,
  chartIndex,
  isPlanning = false,
  isGenerating = false,
  versions = [],
  currentVersionIndex = 0,
  onFixComplete,
  onVersionChange,
}: GeneratedChartProps) {
  // All hooks must be called before any early returns
  const [isFixing, setIsFixing] = useState(false);

  // Determine which chart to display: from versions if available, otherwise from props
  const currentVersion =
    versions.length > 0 ? versions[currentVersionIndex] : null;
  const chartContent = currentVersion?.chart || chart.chart || '';

  // Pattern 3: Individual fix hook per chart component
  const fixHook = useObject({
    api: '/api/mermaid/fix',
    schema: mermaidFixResponseSchema,
    onFinish: async (result) => {
      setIsFixing(false);

      if (result.object) {
        try {
          // Update parent component state to stay in sync
          if (onFixComplete) {
            onFixComplete(
              chartIndex,
              result.object.chart,
              result.object.explanation || 'Fixed chart'
            );
          }
        } catch (error) {
          console.error('Failed to process fix result:', error);
        }
      }
    },
    onError: (error) => {
      setIsFixing(false);
      console.error('Fix error:', error.message);
    },
  });

  // Handle manual fix trigger
  const handleManualFix = (errorMessage?: string) => {
    if (errorMessage && !isFixing && plan) {
      setIsFixing(true);

      fixHook.submit({
        chart: chartContent || '',
        error: errorMessage,
        chartType: plan.type,
        planDescription: plan.description,
      });
    }
  };

  // Always use the current version chart from session data
  const displayChart = chartContent;

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
          {plan?.type ?? 'Chart'} Visualization
        </motion.h3>

        {/* Description accordion - hidden by default when not planning/generating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Accordion
            type='single'
            collapsible
            defaultValue={
              isPlanning || isGenerating ? 'description' : undefined
            }
            className='border-none'
          >
            <AccordionItem value='description' className='border-none'>
              <AccordionTrigger className='text-monochrome-silver hover:text-monochrome-cloud font-light text-sm tracking-wide py-2 hover:no-underline'>
                Description
              </AccordionTrigger>
              <AccordionContent className='pb-4'>
                <div className='text-monochrome-silver font-light leading-loose text-sm tracking-wide prose prose-sm prose-invert max-w-none'>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className='mb-3 last:mb-0 leading-loose'>
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className='font-medium text-monochrome-cloud'>
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className='italic text-monochrome-pearl'>
                          {children}
                        </em>
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
                    {plan?.description || 'Preparing visualization...'}
                  </ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      {/* Version selection */}
      {versions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className='mb-6'
        >
          <div className='flex items-center gap-2 text-sm text-monochrome-silver'>
            <span className='font-light'>
              {versions.length > 1 ? 'Versions:' : 'Version:'}
            </span>
            <div className='flex gap-1'>
              {versions.map((version, index) => (
                <motion.button
                  key={version.version}
                  whileHover={versions.length > 1 ? { scale: 1.05 } : {}}
                  whileTap={versions.length > 1 ? { scale: 0.95 } : {}}
                  onClick={() =>
                    versions.length > 1 && onVersionChange?.(chartIndex, index)
                  }
                  disabled={versions.length === 1}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    index === currentVersionIndex
                      ? 'bg-monochrome-pure-white text-monochrome-pure-black'
                      : versions.length > 1
                        ? 'bg-monochrome-charcoal/20 text-monochrome-silver hover:bg-monochrome-graphite/30 hover:text-monochrome-cloud cursor-pointer'
                        : 'bg-monochrome-charcoal/20 text-monochrome-silver cursor-default'
                  }`}
                  title={`${version.source === ChartSource.GENERATION ? 'Generated' : 'Fixed'} - ${version.rationale}`}
                >
                  v{version.version}
                  {version.source === ChartSource.FIX && (
                    <span className='ml-1 text-green-400'>✓</span>
                  )}
                </motion.button>
              ))}
              {versions.length > 1 && (
                <span className='text-xs text-monochrome-ash ml-2 self-center'>
                  ({versions.length} versions)
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chart content with manual fix controls */}
      {displayChart ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          <MermaidDiagram
            key={`${id}-${currentVersionIndex}`}
            id={id || 'chart'}
            chart={displayChart}
            description={plan?.description}
            onFixClick={handleManualFix}
            isFixing={isFixing}
          />
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
            {isPlanning
              ? 'Planning visualization'
              : isGenerating
                ? 'Generating visualization'
                : isFixing
                  ? 'Applying fix...'
                  : 'An error occurred while generating the chart.'}
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}
