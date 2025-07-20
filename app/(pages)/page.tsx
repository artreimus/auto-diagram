'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { chartPlanSchema as plannerSchema } from '@/app/api/planner/schema';
import { GeneratedChart } from '../components/GeneratedChart';
import {
  HistoryChart,
  HistorySession,
  historySessionSchema,
} from '@/app/lib/history';
import { nanoid } from 'nanoid';
import { AutoDiagramLogo } from '../components/AutoDiagramLogo';

// Animation configurations - inspired by Apple's fluid motion
const springConfig = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 16,
  mass: 0.8,
};

const MinimalLoadingSpinner = () => (
  <div
    className='flex items-center justify-center space-x-1'
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

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [completedCharts, setCompletedCharts] = useState<
    Map<number, HistoryChart>
  >(new Map());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const {
    object: plannedCharts,
    submit,
    isLoading: isPlanning,
    error: planningError,
  } = useObject({
    api: '/api/planner',
    schema: plannerSchema,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    // Create a new session ID immediately
    const sessionId = nanoid();
    setCurrentSessionId(sessionId);
    setHasSubmitted(true);
    setCompletedCharts(new Map());
    setHasSaved(false);
    submit({ messages: [{ role: 'user', content: prompt }] });
  };

  // Track if the entire process is still running (planning + chart generation)
  const isProcessing = isPlanning || (hasSubmitted && !hasSaved);

  const handleChartComplete = useCallback(
    (id: number, chartData: HistoryChart) => {
      setCompletedCharts((prev) => new Map(prev).set(id, chartData));
    },
    []
  );

  // Handle session completion and navigation
  useEffect(() => {
    if (
      !plannedCharts ||
      !Array.isArray(plannedCharts) ||
      plannedCharts.length === 0 ||
      hasSaved ||
      !currentSessionId
    ) {
      return;
    }

    const allChartsCompleted =
      completedCharts.size === plannedCharts.length && completedCharts.size > 0;

    if (allChartsCompleted) {
      const newSession: HistorySession = {
        id: currentSessionId,
        prompt: prompt,
        createdAt: new Date().toISOString(),
        charts: Array.from(completedCharts.values()),
      };

      // Validate the new session before saving and navigating
      const validation = historySessionSchema.safeParse(newSession);

      if (validation.success) {
        // Save to localStorage
        try {
          const saved = localStorage.getItem('chart-history');
          const history: HistorySession[] = saved ? JSON.parse(saved) : [];
          const newHistory = [...history, validation.data];
          localStorage.setItem('chart-history', JSON.stringify(newHistory));
          setHasSaved(true);

          // Dispatch custom event to notify ClientLayout to refresh history
          window.dispatchEvent(new CustomEvent('chart-history-updated'));

          // Navigate to the new session page
          router.push(`/session/${currentSessionId}`);
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      } else {
        console.error('Failed to validate new session:', validation.error);
      }
    }
  }, [
    completedCharts,
    plannedCharts,
    prompt,
    hasSaved,
    currentSessionId,
    router,
  ]);

  const error = planningError
    ? 'Something went wrong. Please try again.'
    : null;

  const hasResults = Array.isArray(plannedCharts) && plannedCharts.length > 0;
  const showResults = hasSubmitted && (hasResults || isPlanning || error);

  return (
    <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
      {/* Luxurious gradient overlay for depth */}
      <div className='absolute inset-0 bg-gradient-to-br from-monochrome-charcoal/20 via-transparent to-monochrome-graphite/10 pointer-events-none' />

      <div className='relative z-10'>
        {/* Header removed - now handled by layout */}

        {/* Input container - animates from center to top */}
        <motion.div
          layout
          initial={false}
          animate={{
            minHeight: hasSubmitted ? 'auto' : 'calc(100vh - 72px)',
            paddingTop: hasSubmitted ? '72px' : '0px', // Always account for header
          }}
          transition={springConfig}
          className='container mx-auto px-6 flex flex-col'
        >
          <motion.div
            layout
            className={`${hasSubmitted ? '' : 'flex-1 flex items-center justify-center'}`}
          >
            <motion.div layout className='w-full max-w-2xl mx-auto'>
              {/* Landing state: Pure, centered elegance */}
              {!hasSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className='text-center mb-12'
                >
                  <div className='flex items-center justify-center gap-4 mb-4'>
                    <AutoDiagramLogo className='w-12 h-12 md:w-16 md:h-16 text-monochrome-pure-white' />
                    <h1 className='text-4xl md:text-5xl font-light tracking-tight text-monochrome-pure-white'>
                      Auto Diagram
                    </h1>
                  </div>
                  <p className='text-lg font-light text-monochrome-silver tracking-wide'>
                    Visualize anything with AI
                  </p>
                </motion.div>
              )}

              {/* The sacred input - minimalist perfection */}
              <form onSubmit={handleSubmit} className='relative'>
                <div className='relative'>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='Ask me anything…'
                    className='w-full text-base font-medium tracking-tight text-monochrome-pure-white placeholder:text-monochrome-ash bg-transparent border border-monochrome-pewter/30 focus:border-monochrome-pure-white/60 hover:border-monochrome-pearl/40 rounded-2xl px-6 py-4 pr-12 transition-all duration-300 ease-out focus:outline-none focus:ring-0 shadow-micro backdrop-blur-sm min-h-[3.5rem] max-h-48 resize-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-monochrome-pewter/30 hover:scrollbar-thumb-monochrome-pewter/50'
                    disabled={isProcessing}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault();
                        if (prompt.trim() && !isProcessing) {
                          const sessionId = nanoid();
                          setCurrentSessionId(sessionId);
                          setHasSubmitted(true);
                          setCompletedCharts(new Map());
                          setHasSaved(false);
                          submit({
                            messages: [{ role: 'user', content: prompt }],
                          });
                        }
                      }
                    }}
                  />

                  {/* Hairline inner glow on focus */}
                  <div className='absolute inset-0 rounded-2xl pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300'>
                    <div className='absolute inset-0 rounded-2xl shadow-hairline' />
                  </div>
                </div>

                {/* Submit affordance - only show when there's content */}
                <AnimatePresence>
                  {prompt.trim() && !isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className='absolute right-2 top-1/2 -translate-y-1/2 z-10'
                    >
                      <Button
                        type='submit'
                        className='rounded-xl px-3 py-2 text-lg font-medium text-monochrome-pure-white bg-transparent hover:bg-monochrome-pure-white/10 transition-all duration-200 leading-none'
                      >
                        <svg
                          width='16'
                          height='16'
                          viewBox='0 0 24 24'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                          className='rotate-45'
                        >
                          <path
                            d='M5 12h14M12 5l7 7-7 7'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Elegant loading state */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='absolute right-6 top-1/2 -translate-y-1/2 z-10'
                  >
                    <MinimalLoadingSpinner />
                  </motion.div>
                )}
              </form>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Results section - appears with graceful animation */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className='container mx-auto px-6 pb-16 pt-12'
            >
              {/* Error state - restrained and informative */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='mb-8 p-6 border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl backdrop-blur-sm'
                >
                  <p className='text-monochrome-cloud font-medium'>{error}</p>
                </motion.div>
              )}

              {/* Processing state - minimal and sophisticated */}
              {isProcessing && !hasResults && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex items-center justify-center py-8'
                >
                  <div className='flex items-center space-x-4'>
                    <MinimalLoadingSpinner />
                    <span className='text-monochrome-silver font-light tracking-wide'>
                      {isPlanning ? 'Planning' : 'Generating'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Chart planning preview - subtle revelation */}
              {hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className='mb-12'
                >
                  <h2 className='text-xl font-light tracking-tight text-monochrome-pure-white mb-6'>
                    Planned Visualizations
                  </h2>
                  <div className='flex flex-wrap gap-3'>
                    {plannedCharts.map((plan, index) =>
                      plan && plan.type && plan.description ? (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Badge
                            variant='secondary'
                            className='bg-monochrome-graphite border border-monochrome-pewter/30 text-monochrome-cloud hover:bg-monochrome-slate-dark/50 transition-colors duration-200 px-3 py-1.5 text-sm font-light tracking-wide'
                          >
                            {plan.type}
                          </Badge>
                        </motion.div>
                      ) : null
                    )}
                  </div>
                </motion.div>
              )}

              {/* Generated charts - the main revelation */}
              {hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <h2 className='text-2xl font-light tracking-tight text-monochrome-pure-white mb-8'>
                    Generated Charts
                  </h2>
                  <div className='grid gap-12'>
                    {plannedCharts.map((plan, index) =>
                      plan ? (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 32 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.7,
                            delay: 0.6 + index * 0.2,
                            ease: 'easeOut',
                          }}
                        >
                          <GeneratedChart
                            plan={plan}
                            planId={index}
                            onComplete={handleChartComplete}
                            originalUserMessage={prompt}
                            isPlanning={isPlanning}
                          />
                        </motion.div>
                      ) : null
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
