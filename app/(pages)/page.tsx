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

type ChartStatus = 'pending' | 'generating' | 'fixing' | 'completed' | 'error';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use ref to store current sessionId for onFinish callbacks
  const sessionIdRef = useRef<string | null>(null);

  // Session management with event-driven sync
  const { createSession, syncSession } = useSessionManagement();

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
    onFinish: (result) => {
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId && result.object && Array.isArray(plannedCharts)) {
        // SYNC POINT #3: Batch generation complete - event-driven
        const mermaidResults = result.object.results;
        const chartResults = plannedCharts.map((plan, index) => {
          const mermaidResult = mermaidResults.find((r) => r.index === index);
          return {
            plan,
            mermaidResult: mermaidResult?.chart,
            fixResult: undefined,
            finalChart: mermaidResult?.chart?.chart,
            error: mermaidResult?.error,
            status: mermaidResult?.success ? 'completed' : 'error',
          };
        });

        syncSession(currentSessionId, {
          status: 'charts_completed',
          batchMermaidResults: mermaidResults,
          chartResults,
          updatedAt: Date.now(),
        });
      }
    },
  });

  // Pattern 1: Sequential Processing - Planner streamObject with onFinish sync
  const plannerHook = useObject({
    api: '/api/planner',
    schema: plannerSchema,
    onFinish: (result) => {
      console.log('planning complete');
      const currentSessionId = sessionIdRef.current;
      console.log('currentSessionId from ref', currentSessionId);
      console.log('result', result);
      console.log('result.object', result.object);
      console.log('array check', Array.isArray(result.object));

      console.log(
        'currentSessionId && result.object && Array.isArray(result.object)',
        currentSessionId && result.object && Array.isArray(result.object)
      );

      if (currentSessionId && result.object && Array.isArray(result.object)) {
        // SYNC POINT #2: Planning complete - event-driven
        syncSession(currentSessionId, {
          status: 'charts_generating',
          plannedCharts: result.object,
          updatedAt: Date.now(),
        });

        // Pattern 2 Implementation: Trigger batch mermaid generation immediately
        console.log('generating charts');
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
      console.log('planning exit');
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
  ): ChartStatus => {
    const result = mermaidResult as
      | { chart?: { chart?: string }; error?: string }
      | undefined;
    if (isBatchGenerating && !result) return 'generating';
    if (result?.chart?.chart) return 'completed';
    if (result?.error) return 'error';
    return 'pending';
  };

  // Handle fix completion from individual chart components
  const handleFixComplete = useCallback(() => {
    const currentSessionId = sessionIdRef.current;
    if (currentSessionId) {
      // SYNC POINT #4: Individual fix complete - event-driven per chart
      syncSession(currentSessionId, {
        status: 'manual_fix_completed',
        updatedAt: Date.now(),
      });
    }
  }, [syncSession]);

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

        // Create session immediately with initial data
        const newSessionId = await createSession({
          prompt: prompt.trim(),
          status: 'planning',
          timestamp: Date.now(),
          plannedCharts: null,
          batchMermaidResults: null,
          chartResults: [],
        });

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
            onKeyDown={() => {}} // Simple no-op handler
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
