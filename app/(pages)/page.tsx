'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { z } from 'zod';

import { plannerSchema, ChartPlan } from '@/app/api/planner/schema';
import { mermaidSchema } from '@/app/api/mermaid/schema';
import { GeneratedChart } from '../components/GeneratedChart';
import { AutoDiagramLogo } from '../components/AutoDiagramLogo';
import { ErrorState } from '../components/ErrorState';
import { ProcessingState } from '../components/ProcessingState';
import { PlannedChartsBadges } from '../components/PlannedChartsBadges';
import { InputWithSubmit } from '../components/InputWithSubmit';
import {
  AnimatedInputContainer,
  LandingHero,
  ResultsSection,
  ChartGenerationSection,
} from '../components/AnimatedWrappers';
import { useSessionManagement } from '@/hooks/use-session-management';
import { chartRevealAnimation } from '@/app/lib/animations';
import { ChartSource, ResultStatus } from '../enum/session';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use refs to store current sessionId and plannedCharts for onFinish callbacks
  const sessionIdRef = useRef<string | null>(null);
  const plannedChartsRef = useRef<ChartPlan[] | null>(null);

  // Session management with event-driven sync
  const { createSession, addResult, addChartToResult } = useSessionManagement();

  // Pattern 2: Single batch mermaid generation hook with onFinish sync
  const batchMermaidHook = useObject({
    api: '/api/mermaid/batch',
    schema: z.object({
      results: z.array(
        z.object({
          success: z.boolean(),
          chart: mermaidSchema.optional(),
          error: z.string().optional(),
          index: z.number(),
        })
      ),
    }),
    onFinish: async (result) => {
      const currentSessionId = sessionIdRef.current;
      const currentPlannedCharts = plannedChartsRef.current;
      if (
        currentSessionId &&
        result.object &&
        Array.isArray(currentPlannedCharts)
      ) {
        // SYNC POINT #3: Batch generation complete - create results
        const mermaidResults = result.object.results;

        // Create a single result with all planned charts
        const charts = [];
        for (let index = 0; index < currentPlannedCharts.length; index++) {
          const plan = currentPlannedCharts[index];
          const mermaidResult = mermaidResults.find(
            (r) => r && r.index === index
          );

          if (plan && plan.type && plan.description) {
            charts.push({
              chart: mermaidResult?.chart?.chart || '',
              rationale: mermaidResult?.chart?.description || 'Generated chart',
              source: ChartSource.GENERATION,
              error: mermaidResult?.error,
              plan: plan as { type: typeof plan.type; description: string },
            });
          }
        }

        if (charts.length > 0) {
          try {
            // Add the first chart as the main result
            const resultId = await addResult(
              currentSessionId,
              prompt.trim(),
              charts[0]
            );

            // Add remaining charts to the same result
            for (let i = 1; i < charts.length; i++) {
              await addChartToResult(currentSessionId, resultId, charts[i]);
            }
          } catch (error) {
            console.error('Failed to add result:', error);
          }
        }
      }
    },
  });

  // Pattern 1: Sequential Processing - Planner streamObject with onFinish sync
  const plannerHook = useObject({
    api: '/api/planner',
    schema: plannerSchema,
    onFinish: (result) => {
      const currentSessionId = sessionIdRef.current;

      if (currentSessionId && result.object && Array.isArray(result.object)) {
        // SYNC POINT #2: Planning complete - event-driven
        // Note: For now, we'll skip syncing planning data since the schema doesn't support it yet
        // syncSession(currentSessionId, {});

        // Store planned charts in ref for batch onFinish callback
        plannedChartsRef.current = result.object;

        // Pattern 2 Implementation: Trigger batch mermaid generation immediately
        if (result.object.length > 0) {
          batchMermaidHook.submit({
            charts: result.object.map((plan: ChartPlan) => ({
              chartType: plan.type,
              description: plan.description,
              originalUserMessage: prompt,
              planDescription: plan.description,
            })),
          });
        }
      }
    },
  });

  // Derived state
  const plannedCharts = plannerHook.object;
  const isPlanning = plannerHook.isLoading;
  const planningError = plannerHook.error;
  const mermaidResults = batchMermaidHook.object?.results;
  const isBatchGenerating = batchMermaidHook.isLoading;

  // Helper function for status determination (moved before usage)
  const getChartStatus = (
    mermaidResult: unknown,
    isBatchGenerating: boolean
  ): ResultStatus => {
    const result = mermaidResult as
      | { chart?: { chart?: string }; error?: string }
      | undefined;
    if (isBatchGenerating && !result) return ResultStatus.GENERATING;
    if (result?.chart?.chart) return ResultStatus.COMPLETED;
    if (result?.error) return ResultStatus.ERROR;
    return ResultStatus.PENDING;
  };

  // Handle fix completion from individual chart components
  const handleFixComplete = useCallback(() => {
    const currentSessionId = sessionIdRef.current;
    if (currentSessionId) {
      // SYNC POINT #4: Individual fix complete - event-driven per chart
      // Note: For now, we'll skip syncing fix completion since the schema doesn't support it yet
      // syncSession(currentSessionId, {});
    }
  }, []);

  // Chart status computation with simplified logic
  const chartStatuses = useMemo(() => {
    if (!Array.isArray(plannedCharts)) return [];

    // Filter out incomplete chart plans during streaming
    const completePlans = plannedCharts.filter(
      (plan): plan is ChartPlan =>
        plan != null &&
        typeof plan.type === 'string' &&
        typeof plan.description === 'string'
    );

    return completePlans.map((plan, index) => {
      const mermaidResult = mermaidResults?.find((r) => r && r.index === index);

      return {
        plan,
        status: getChartStatus(mermaidResult, isBatchGenerating),
        chart: mermaidResult?.chart?.chart,
        isGenerating: isBatchGenerating && !mermaidResult,
        isFixing: false, // Will be managed by individual GeneratedChart components
        error: mermaidResult?.error ? new Error(mermaidResult.error) : null,
        retryCount: 0, // Will be managed by individual GeneratedChart components
        mermaidResult: mermaidResult,
        fixResult: undefined, // Will be managed by individual GeneratedChart components
        canFix: Boolean(mermaidResult?.error),
        fixError: undefined, // Will be managed by individual GeneratedChart components
        chartIndex: index, // Add chart index for versioning
      };
    });
  }, [plannedCharts, mermaidResults, isBatchGenerating]);

  // Track if the entire process is still running
  const isProcessing = isPlanning || (hasSubmitted && isBatchGenerating);

  // SYNC POINT #1: Create session immediately on submission
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim() && !isProcessing) {
        setHasSubmitted(true);

        // Create session immediately
        const newSessionId = await createSession();

        setSessionId(newSessionId);
        sessionIdRef.current = newSessionId; // Update ref

        // Start planning - onFinish will handle sync AND trigger batch generation
        plannerHook.submit({
          messages: [{ role: 'user', content: prompt.trim() }],
        });
      }
    },
    [prompt, isProcessing, createSession, plannerHook]
  );

  // Handle render errors - now just shows error, doesn't auto-fix
  const handleRenderError = useCallback((planId: number, error: string) => {
    console.error(`Render error for chart ${planId}:`, error);
    // Could update session with render error if needed
  }, []);

  const error = planningError
    ? 'Something went wrong. Please try again.'
    : null;
  const hasResults = Array.isArray(plannedCharts) && plannedCharts.length > 0;
  const showResults = hasSubmitted && (hasResults || isPlanning || !!error);

  return (
    <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
      {/* Luxurious gradient overlay for depth */}
      <div className='absolute inset-0 bg-gradient-to-br from-monochrome-charcoal/20 via-transparent to-monochrome-graphite/10 pointer-events-none' />

      <div className='relative z-10'>
        {/* Session indicator */}
        {sessionId && (
          <div className='fixed top-4 right-4 text-xs text-monochrome-ash'>
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}

        {/* Input container - animates from center to top */}
        <AnimatedInputContainer hasSubmitted={hasSubmitted}>
          {/* Landing state: Pure, centered elegance */}
          {!hasSubmitted && (
            <LandingHero>
              <div className='flex items-center justify-center gap-4 mb-4'>
                <AutoDiagramLogo className='w-12 h-12 md:w-16 md:h-16 text-monochrome-pure-white' />
                <h1 className='text-4xl md:text-5xl font-light tracking-tight text-monochrome-pure-white'>
                  Auto Diagram
                </h1>
              </div>
              <p className='text-lg font-light text-monochrome-silver tracking-wide'>
                Visualize anything with AI
              </p>
            </LandingHero>
          )}

          {/* The sacred input - minimalist perfection */}
          <InputWithSubmit
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleFormSubmit}
            isProcessing={isProcessing}
            autoFocus
          />
        </AnimatedInputContainer>

        {/* Results section - appears with graceful animation */}
        <ResultsSection show={showResults}>
          {/* Error state - restrained and informative */}
          {error && <ErrorState message={error} />}

          {/* Processing state - minimal and sophisticated */}
          {isProcessing && !hasResults && !error && (
            <ProcessingState isPlanning={isPlanning} />
          )}

          {/* Chart planning preview - subtle revelation */}
          {hasResults && plannedCharts && (
            <PlannedChartsBadges
              plannedCharts={plannedCharts.filter(
                (plan): plan is ChartPlan =>
                  plan != null &&
                  typeof plan.type === 'string' &&
                  typeof plan.description === 'string'
              )}
            />
          )}

          {/* Generated charts - the main revelation */}
          {hasResults && (
            <ChartGenerationSection>
              {chartStatuses.map((chartStatus, index) => (
                <motion.div key={index} {...chartRevealAnimation(index)}>
                  <GeneratedChart
                    chartStatus={chartStatus}
                    planId={index}
                    onRenderError={handleRenderError}
                    onFixComplete={handleFixComplete}
                    originalUserMessage={prompt}
                  />
                </motion.div>
              ))}
            </ChartGenerationSection>
          )}
        </ResultsSection>
      </div>
    </div>
  );
}
