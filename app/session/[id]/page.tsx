'use client';

import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { GeneratedChart } from '@/app/components/GeneratedChart';
import { useSessionManagement } from '@/hooks/use-session-management';
import { chartRevealAnimation } from '@/app/lib/animations';
import { ChartSource } from '@/app/enum/session';
import { MinimalLoadingSpinner } from '@/app/components/MinimalLoadingSpinner';

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  // Session management
  const { addChartVersion, loadSession, isLoading, currentSession } =
    useSessionManagement();

  // Load session data when component mounts or sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Handle fix completion by updating sessionData directly
  const handleFixComplete = useCallback(
    async (chartIndex: number, fixedChart: string, rationale: string) => {
      if (!currentSession?.results?.[0] || !sessionId) return;

      try {
        const result = currentSession.results[0];
        const chart = result.charts[chartIndex];

        if (chart) {
          // Add the fixed chart as a new version
          await addChartVersion(sessionId, result.id, chart.id, {
            chart: fixedChart,
            rationale,
            source: ChartSource.FIX,
            error: undefined,
          });
          // The hook will automatically update currentSession via syncSession
        }
      } catch (error) {
        console.error('Failed to save fix result to session:', error);
      }
    },
    [currentSession, sessionId, addChartVersion]
  );

  if (isLoading || (sessionId && !currentSession)) {
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

  if (!currentSession) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-light tracking-tight mb-4 text-monochrome-pure-white'>
            Session not found
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
              {currentSession.results[0]?.prompt || 'Session'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className='text-sm text-monochrome-silver'
            >
              Created on{' '}
              {new Date(currentSession.createdAt).toLocaleDateString()} •{' '}
              {currentSession.results.length} result
              {currentSession.results.length !== 1 ? 's' : ''}
            </motion.p>
          </div>

          {/* Results display */}
          <div className='grid gap-12'>
            {currentSession.results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.4 + index * 0.2,
                  ease: 'easeOut',
                }}
                className='border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-3xl p-8 backdrop-blur-sm shadow-soft'
              >
                {result.charts.length > 0 && (
                  <>
                    {/* Generation history info */}
                    {result.charts.some(
                      (chart) => chart.versions.length > 1
                    ) && (
                      <div className='mt-4 p-3 bg-monochrome-graphite/30 rounded-xl border border-monochrome-pewter/20'>
                        <p className='text-xs text-monochrome-ash mb-2'>
                          Generation History
                        </p>
                        {result.charts.map((chart, chartIndex) => (
                          <div key={chartIndex} className='mb-2 last:mb-0'>
                            <p className='text-xs text-monochrome-silver/90 mb-1'>
                              Chart {chartIndex + 1}: {chart.plan.description}
                            </p>
                            {chart.versions.map((version, versionIndex) => (
                              <div
                                key={versionIndex}
                                className='text-xs text-monochrome-silver/70 mb-1 ml-2'
                              >
                                Version {version.version}: {version.source}
                                {version.error && (
                                  <span className='ml-2 text-monochrome-ash'>
                                    • {version.error}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Display all charts in the result */}
                    <div className='grid gap-8'>
                      {result.charts.map((chart, chartIndex) => {
                        const currentVersion =
                          chart.versions[chart.currentVersion]; // Use array index
                        if (!currentVersion) return null;

                        return (
                          <motion.div
                            key={chartIndex}
                            {...chartRevealAnimation(chartIndex)}
                          >
                            <GeneratedChart
                              id={`session-${currentSession.id}-${result.id}-${chartIndex}`}
                              plan={chart.plan}
                              chart={{
                                type: chart.plan.type,
                                description: currentVersion.rationale,
                                chart: currentVersion.chart,
                              }}
                              onFixComplete={(_, fixedChart, rationale) => {
                                handleFixComplete(
                                  chartIndex,
                                  fixedChart,
                                  rationale
                                );
                              }}
                              isPlanning={false}
                              isGenerating={false}
                            />
                            <div className='mt-4 px-4'>
                              <div className='flex items-center gap-2 text-xs text-monochrome-silver'>
                                <span>
                                  Type:{' '}
                                  {chart.plan.type.charAt(0).toUpperCase() +
                                    chart.plan.type.slice(1)}
                                </span>
                                <span>•</span>
                                <span>Version: {chart.currentVersion + 1}</span>
                                {chart.versions.length > 1 && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {chart.versions.length} versions
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
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
