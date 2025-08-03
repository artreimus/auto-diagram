'use client';

import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { GeneratedChart } from '@/app/components/GeneratedChart';
import { useSessionManagement } from '@/app/hooks/use-session-management';
import { chartRevealAnimation } from '@/app/lib/animations';
import { ChartSource, ResultStatus } from '@/app/enum/session';
import { BouncingDotsLoader } from '@/app/components/BouncingDotsLoader';

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  // Session management
  const {
    addChartVersion,
    loadSession,
    syncSession,
    isLoading,
    currentSession,
  } = useSessionManagement();

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
            status: ResultStatus.COMPLETED,
          });
          // The hook will automatically update currentSession via syncSession
        }
      } catch (error) {
        console.error('Failed to save fix result to session:', error);
      }
    },
    [currentSession, sessionId, addChartVersion]
  );

  // Handle version change for specific charts
  const handleVersionChange = useCallback(
    async (chartIndex: number, versionIndex: number) => {
      if (!currentSession?.results?.[0] || !sessionId) return;

      try {
        const result = currentSession.results[0];
        const chart = result.charts[chartIndex];

        if (chart && versionIndex < chart.versions.length) {
          // Update the chart's currentVersion via session management
          const updatedCharts = [...result.charts];
          updatedCharts[chartIndex] = {
            ...chart,
            currentVersion: versionIndex,
          };

          const updatedResults = [...currentSession.results];
          updatedResults[0] = {
            ...result,
            charts: updatedCharts,
            updatedAt: new Date().toISOString(),
          };

          // Update the entire session with new results
          await syncSession(sessionId, {
            results: updatedResults,
          });
        }
      } catch (error) {
        console.error('Failed to change version:', error);
      }
    },
    [currentSession, sessionId, syncSession]
  );

  if (isLoading || (sessionId && !currentSession)) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='flex items-center space-x-4'>
          <BouncingDotsLoader />
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
                              chartIndex={chartIndex}
                              chart={{
                                type: chart.plan.type,
                                description: currentVersion.rationale,
                                chart: currentVersion.chart,
                              }}
                              versions={chart.versions}
                              currentVersionIndex={chart.currentVersion}
                              onFixComplete={(_, fixedChart, rationale) => {
                                handleFixComplete(
                                  chartIndex,
                                  fixedChart,
                                  rationale
                                );
                              }}
                              onVersionChange={handleVersionChange}
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
