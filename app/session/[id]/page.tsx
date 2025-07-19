'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from '@/app/components/MermaidDiagram';
import { HistorySession, FixAttempt } from '@/app/lib/history';

const MinimalLoadingSpinner = () => (
  <div
    className='flex items-center justify-center space-x-1'
    role='status'
    aria-live='polite'
    aria-label='Loading session'
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

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<HistorySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle manual fix success and update localStorage
  const handleManualFixSuccess = (
    chartIndex: number,
    updatedChart: string,
    fixAttempts: FixAttempt[]
  ) => {
    if (!session) return;

    const updatedSession = { ...session };
    if (updatedSession.charts[chartIndex]?.mermaid) {
      updatedSession.charts[chartIndex].mermaid.chart = updatedChart;
      updatedSession.charts[chartIndex].fixAttempts = [
        ...(updatedSession.charts[chartIndex].fixAttempts || []),
        ...fixAttempts,
      ];
    }

    setSession(updatedSession);

    // Update localStorage
    try {
      const saved = localStorage.getItem('chart-history');
      if (saved) {
        const history: HistorySession[] = JSON.parse(saved);
        const sessionIndex = history.findIndex((s) => s.id === sessionId);
        if (sessionIndex !== -1) {
          history[sessionIndex] = updatedSession;
          localStorage.setItem('chart-history', JSON.stringify(history));

          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('chart-history-updated'));
        }
      }
    } catch (error) {
      console.error('Failed to update localStorage after manual fix:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId) {
      try {
        const saved = localStorage.getItem('chart-history');
        if (saved) {
          const history: HistorySession[] = JSON.parse(saved);
          const foundSession = history.find((s) => s.id === sessionId);

          if (foundSession) {
            setSession(foundSession);
          } else {
            setError('Session not found');
          }
        } else {
          setError('No history found');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='flex items-center space-x-4'>
          <MinimalLoadingSpinner />
          <span className='text-monochrome-silver font-light tracking-wide'>
            Loading session...
          </span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-light tracking-tight mb-4 text-monochrome-pure-white'>
            {error || 'Session not found'}
          </h1>
          <p className='text-monochrome-silver font-light tracking-wide'>
            The requested session could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
      {/* Luxurious gradient overlay for depth */}
      <div className='absolute inset-0 bg-gradient-to-br from-monochrome-charcoal/20 via-transparent to-monochrome-graphite/10 pointer-events-none' />

      <div className='relative z-10 pt-6'>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='w-full mx-auto px-6 py-8'
        >
          {/* Session header */}
          <div className='mb-8'>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className='text-2xl font-light tracking-tight text-monochrome-pure-white mb-2'
            >
              {session.prompt}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className='text-sm text-monochrome-silver'
            >
              Created on {new Date(session.createdAt).toLocaleDateString()} •{' '}
              {session.charts.length} chart
              {session.charts.length !== 1 ? 's' : ''}
            </motion.p>
          </div>

          {/* Charts display */}
          <div className='grid gap-12'>
            {session.charts.map((chart, index) => (
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
                              <li className='text-sm leading-loose'>
                                {children}
                              </li>
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
                          {chart.plan.description}
                        </ReactMarkdown>
                      </div>

                      {/* Generation history info */}
                      {chart.fixAttempts && chart.fixAttempts.length > 0 && (
                        <div className='mt-4 p-3 bg-monochrome-graphite/30 rounded-xl border border-monochrome-pewter/20'>
                          <p className='text-xs text-monochrome-ash mb-2'>
                            Generation History: {chart.fixAttempts.length + 1}{' '}
                            attempt{chart.fixAttempts.length !== 0 ? 's' : ''}
                          </p>
                          {chart.fixAttempts.map((attempt, attemptIndex) => (
                            <div
                              key={attemptIndex}
                              className='text-xs text-monochrome-silver/70 mb-1'
                            >
                              Attempt {attemptIndex + 1}: {attempt.error}
                              {attempt.explanation && (
                                <span className='ml-2 text-monochrome-ash'>
                                  • {attempt.explanation}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      <MermaidDiagram
                        id={`session-${session.id}-${index}`}
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
                        chartType={chart.plan.type}
                        description={chart.mermaid.description}
                        originalUserMessage={session.prompt}
                        planDescription={chart.plan.description}
                        onManualFixSuccess={(updatedChart, fixAttempts) =>
                          handleManualFixSuccess(
                            index,
                            updatedChart,
                            fixAttempts
                          )
                        }
                      />
                    </motion.div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
