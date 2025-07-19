'use client';

import { useState, useEffect, useCallback } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chartPlanSchema as plannerSchema } from '@/app/api/planner/schema';
import { GeneratedChart } from '../components/GeneratedChart';
import { HistorySidebar } from '../components/HistorySidebar';
import MermaidDiagram from '../components/MermaidDiagram';
import {
  HistoryChart,
  HistorySession,
  historySessionSchema,
} from '@/app/lib/history';
import { nanoid } from 'nanoid';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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

export default function DemoPage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [completedCharts, setCompletedCharts] = useState<
    Map<number, HistoryChart>
  >(new Map());
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(
    null
  );
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);

  // Handle SSR by not rendering sidebar until client is ready
  const [isClient, setIsClient] = useState(false);

  // Load history from localStorage only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chart-history');
        if (saved) {
          const parsed = JSON.parse(saved);
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load chart history:', error);
      }
      setIsClient(true);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem('chart-history', JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save chart history:', error);
      }
    }
  }, [history, isClient]);

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
    if (!prompt.trim()) return;

    // Start a new session
    setIsViewingHistory(false);
    setSelectedSession(null);
    setHasSubmitted(true);
    setCompletedCharts(new Map()); // Reset completed charts for new session
    setHasSaved(false); // Reset save status for new session
    submit({ messages: [{ role: 'user', content: prompt }] });
  };

  const handleChartComplete = useCallback(
    (id: number, chartData: HistoryChart) => {
      setCompletedCharts((prev) => new Map(prev).set(id, chartData));
    },
    []
  );

  const handleSessionSelect = (session: HistorySession) => {
    setSelectedSession(session);
    setIsViewingHistory(true);
    setPrompt(session.prompt);
    setHasSubmitted(true); // Show the results area
  };

  const handleNewSession = () => {
    setIsViewingHistory(false);
    setSelectedSession(null);
    setPrompt('');
    setHasSubmitted(false);
    setCompletedCharts(new Map());
    setHasSaved(false);
  };

  useEffect(() => {
    if (
      !plannedCharts ||
      !Array.isArray(plannedCharts) ||
      plannedCharts.length === 0 ||
      hasSaved // Don't save if already saved
    ) {
      return;
    }

    const allChartsCompleted =
      completedCharts.size === plannedCharts.length && completedCharts.size > 0;

    if (allChartsCompleted) {
      const newSession: HistorySession = {
        id: nanoid(),
        prompt: prompt,
        createdAt: new Date().toISOString(),
        charts: Array.from(completedCharts.values()),
      };

      // Validate the new session before adding it to history
      const validation = historySessionSchema.safeParse(newSession);

      if (validation.success) {
        const newHistory = [...history, validation.data];
        setHistory(newHistory);
        setHasSaved(true); // Mark as saved to prevent re-triggering
        setSelectedSession(validation.data); // Select the newly created session
      } else {
        console.error(
          'Failed to validate and save new session:',
          validation.error
        );
      }
    }
  }, [completedCharts, plannedCharts, history, prompt, hasSaved]);

  const error = planningError
    ? 'Something went wrong. Please try again.'
    : null;

  // For current session (new charts being generated)
  const hasResults = Array.isArray(plannedCharts) && plannedCharts.length > 0;
  const showResults = hasSubmitted && (hasResults || isPlanning || error);

  // For history session (displaying completed charts)
  const showHistoryResults = isViewingHistory && selectedSession;

  if (!isClient) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='flex items-center space-x-4'>
          <MinimalLoadingSpinner />
          <span className='text-monochrome-silver font-light tracking-wide'>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
        <HistorySidebar
          sessions={history}
          selectedSessionId={selectedSession?.id || null}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />

        <SidebarInset className='flex-1'>
          {/* Luxurious gradient overlay for depth */}
          <div className='absolute inset-0 bg-gradient-to-br from-monochrome-charcoal/20 via-transparent to-monochrome-graphite/10 pointer-events-none' />

          <div className='relative z-10'>
            {/* Sidebar trigger and header */}
            <div className='flex items-center space-x-4 p-4 border-b border-monochrome-pewter/20'>
              <SidebarTrigger className='text-monochrome-pure-white' />
              {isViewingHistory && selectedSession && (
                <div className='flex-1'>
                  <p className='text-sm text-monochrome-silver'>
                    Viewing session from{' '}
                    {new Date(selectedSession.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Input container - animates from center to top */}
            <motion.div
              layout
              initial={false}
              animate={{
                paddingTop: hasSubmitted ? '56px' : '0px',
                minHeight: hasSubmitted ? 'auto' : '100vh',
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
                      <h1 className='text-4xl md:text-5xl font-light tracking-tight mb-4 text-monochrome-pure-white'>
                        Auto Diagram
                      </h1>
                      <p className='text-lg font-light text-monochrome-silver tracking-wide'>
                        Visualize anything with AI
                      </p>
                    </motion.div>
                  )}

                  {/* The sacred input - minimalist perfection */}
                  {!isViewingHistory && (
                    <form onSubmit={handleSubmit} className='relative'>
                      <div className='relative'>
                        <Input
                          type='text'
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder='Ask me anything…'
                          className='w-full text-base font-medium tracking-tight text-monochrome-pure-white placeholder:text-monochrome-ash bg-transparent border border-monochrome-pewter/30 focus:border-monochrome-pure-white/60 hover:border-monochrome-pearl/40 rounded-2xl px-6 py-4 transition-all duration-300 ease-out focus:outline-none focus:ring-0 shadow-micro backdrop-blur-sm'
                          disabled={isPlanning}
                          autoFocus
                        />

                        {/* Hairline inner glow on focus */}
                        <div className='absolute inset-0 rounded-2xl pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300'>
                          <div className='absolute inset-0 rounded-2xl shadow-hairline' />
                        </div>
                      </div>

                      {/* Submit affordance - only show when there's content */}
                      <AnimatePresence>
                        {prompt.trim() && !isPlanning && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className='absolute right-2 top-1/2 -translate-y-1/2'
                          >
                            <Button
                              type='submit'
                              className='rounded-xl px-4 py-2 text-sm font-medium text-monochrome-pure-white bg-transparent hover:bg-monochrome-pure-white/5 transition-all duration-200'
                            >
                              ↗
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Elegant loading state */}
                      {isPlanning && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='absolute right-6 top-1/2 -translate-y-1/2'
                        >
                          <MinimalLoadingSpinner />
                        </motion.div>
                      )}
                    </form>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Results section - appears with graceful animation */}
            <AnimatePresence>
              {(showResults || showHistoryResults) && (
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  className='container mx-auto px-6 pb-16 pt-12'
                >
                  {/* Error state - restrained and informative */}
                  {error && !isViewingHistory && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className='mb-8 p-6 border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl backdrop-blur-sm'
                    >
                      <p className='text-monochrome-cloud font-medium'>
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Planning state - minimal and sophisticated */}
                  {isPlanning && !hasResults && !error && !isViewingHistory && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='flex items-center justify-center py-16'
                    >
                      <div className='flex items-center space-x-4'>
                        <MinimalLoadingSpinner />
                        <span className='text-monochrome-silver font-light tracking-wide'>
                          Planning
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Chart planning preview - subtle revelation */}
                  {hasResults && !isViewingHistory && (
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

                  {/* Generated charts - the main revelation (for new sessions) */}
                  {hasResults && !isViewingHistory && (
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

                  {/* Historical charts display */}
                  {showHistoryResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className='mb-8'>
                        <h2 className='text-2xl font-light tracking-tight text-monochrome-pure-white mb-2'>
                          {selectedSession.prompt}
                        </h2>
                        <p className='text-sm text-monochrome-silver'>
                          Created on{' '}
                          {new Date(
                            selectedSession.createdAt
                          ).toLocaleDateString()}{' '}
                          • {selectedSession.charts.length} chart
                          {selectedSession.charts.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className='grid gap-12'>
                        {selectedSession.charts.map((chart, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.7,
                              delay: 0.4 + index * 0.2,
                              ease: 'easeOut',
                            }}
                            className='border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-3xl p-8 backdrop-blur-sm shadow-soft'
                          >
                            {chart.mermaid && (
                              <>
                                <div className='mb-8'>
                                  <h3 className='text-xl font-light tracking-tight text-monochrome-pure-white capitalize mb-3'>
                                    {chart.plan.type} Visualization
                                  </h3>
                                  <div className='text-monochrome-silver font-light leading-relaxed text-sm tracking-wide'>
                                    {chart.plan.description}
                                  </div>
                                </div>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 0.6,
                                    ease: 'easeOut',
                                  }}
                                >
                                  <MermaidDiagram
                                    id={`history-${selectedSession.id}-${index}`}
                                    chart={chart.mermaid.chart}
                                    onRenderError={() => {}}
                                    isLoadingFix={false}
                                    fixError={null}
                                    fixedChart={undefined}
                                    retryCount={0}
                                    maxRetries={0}
                                    lastError={null}
                                    previousAttempts={[]}
                                    showSyntax={false}
                                    setShowSyntax={() => {}}
                                  />
                                </motion.div>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
