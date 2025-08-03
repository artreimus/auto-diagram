'use client';

import { useState, useCallback, useRef } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

import { plansSchema, Plan } from '@/app/api/planner/schema';
import { batchMermaidResponseSchema } from '@/app/api/mermaid/schema';
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
import { useSessionManagement } from '@/app/hooks/use-session-management';
import { chartRevealAnimation } from '@/app/lib/animations';
import { ChartSource, ResultStatus } from '../enum/session';
import { ChartType } from '../enum/chart-types';
import { Skeleton } from '@/app/components/ui/skeleton';

// Utility function to parse chart commands from prompt
const parseChartCommands = (prompt: string) => {
  const chartCommands = [
    { command: '/flowchart', type: ChartType.FLOWCHART },
    { command: '/sequence', type: ChartType.SEQUENCE },
    { command: '/class', type: ChartType.CLASS },
    { command: '/state', type: ChartType.STATE },
    { command: '/gantt', type: ChartType.GANTT },
    { command: '/journey', type: ChartType.JOURNEY },
    { command: '/mindmap', type: ChartType.MINDMAP },
    { command: '/timeline', type: ChartType.TIMELINE },
    { command: '/gitgraph', type: ChartType.GITGRAPH },
  ];

  const requestedCharts: ChartType[] = [];
  let cleanedPrompt = prompt;

  // Find all chart commands in the prompt
  for (const { command, type } of chartCommands) {
    if (prompt.includes(command)) {
      requestedCharts.push(type);
      // Remove the command from the prompt
      cleanedPrompt = cleanedPrompt
        .replace(new RegExp(command, 'g'), '')
        .trim();
    }
  }

  // Clean up extra spaces
  cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').trim();

  // If chart types were specified, add them to the beginning of the prompt
  if (requestedCharts.length > 0) {
    const chartTypesList = requestedCharts.join(', ');
    cleanedPrompt = `Create ${chartTypesList} charts for: ${cleanedPrompt}`;
  }

  return {
    cleanedPrompt,
    requestedCharts,
  };
};

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const router = useRouter();

  // Use refs to store current sessionId and plannedCharts for onFinish callbacks
  const sessionIdRef = useRef<string | null>(null);
  const plannedChartsRef = useRef<Plan[] | null>(null);
  const resultIdRef = useRef<string | null>(null);

  // Session management with event-driven sync
  const {
    createSession,
    createEmptyResult,
    addChartVersion,
    addChartToResult,
    syncSession,
    currentSession,
  } = useSessionManagement();

  // Pattern 1: Sequential Processing - Planner streamObject with onFinish sync
  const plannerHook = useObject({
    api: '/api/planner',
    schema: plansSchema,
    onFinish: async (result) => {
      if (result.object && Array.isArray(result.object)) {
        // Store planned charts in ref for batch onFinish callback
        plannedChartsRef.current = result.object;

        // Pattern 2 Implementation: Trigger batch mermaid generation immediately
        if (result.object.length > 0) {
          // Use the cleaned prompt for generation
          const { cleanedPrompt } = parseChartCommands(prompt.trim());

          batchMermaidHook.submit({
            charts: result.object.map((plan: Plan) => ({
              chartType: plan.type,
              description: plan.description,
              originalUserMessage: cleanedPrompt,
              planDescription: plan.description,
            })),
          });
        }
      }
    },
  });

  // Pattern 2: Batch mermaid generation hook with onFinish sync
  const batchMermaidHook = useObject({
    api: '/api/mermaid/batch',
    schema: batchMermaidResponseSchema,
    onFinish: async (result) => {
      const currentSessionId = sessionIdRef.current;
      const currentResultId = resultIdRef.current;
      const currentPlannedCharts = plannedChartsRef.current;

      if (
        currentSessionId &&
        currentResultId &&
        result.object &&
        Array.isArray(currentPlannedCharts)
      ) {
        // SYNC POINT #3: Batch generation complete - update existing result with chart data
        const mermaidResults = result.object.results;

        try {
          // Update each chart in the existing result with generated data
          for (let index = 0; index < currentPlannedCharts.length; index++) {
            const plan = currentPlannedCharts[index];
            const mermaidResult = mermaidResults[index];

            if (plan && plan.type && plan.description) {
              const chartData = {
                id: nanoid(),
                versions: [
                  {
                    version: 1,
                    chart: mermaidResult?.chart?.chart || '',
                    rationale:
                      mermaidResult?.chart?.description || 'Generated chart',
                    source: ChartSource.GENERATION,
                    error: undefined,
                    status: ResultStatus.COMPLETED,
                  },
                ],
                currentVersion: 0, // 0-based index for first version
                plan: plan,
              };

              await addChartToResult(
                currentSessionId,
                currentResultId,
                chartData
              );
            }
          }
        } catch (error) {
          console.error('Failed to update result with chart data:', error);
        }

        // Redirect to session page after successful generation
        if (currentSessionId) {
          router.push(`/session/${currentSessionId}`);
        }
      }
    },
  });

  // Handle fix completion by updating session via hook
  const handleFixComplete = useCallback(
    async (chartIndex: number, fixedChart: string, rationale: string) => {
      if (!currentSession?.results?.[0] || !sessionIdRef.current) return;

      try {
        const result = currentSession.results[0];
        const chart = result.charts[chartIndex];

        if (chart) {
          // Add the fixed chart as a new version via the hook
          await addChartVersion(sessionIdRef.current, result.id, chart.id, {
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
    [currentSession, addChartVersion]
  );

  // Handle version change for specific charts
  const handleVersionChange = useCallback(
    async (chartIndex: number, versionIndex: number) => {
      if (!currentSession?.results?.[0] || !sessionIdRef.current) return;

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
          await syncSession(sessionIdRef.current, {
            results: updatedResults,
          });
        }
      } catch (error) {
        console.error('Failed to change version:', error);
      }
    },
    [currentSession, syncSession]
  );

  // SYNC POINT #1: Create session immediately on submission
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        prompt.trim() &&
        !plannerHook.isLoading &&
        !batchMermaidHook.isLoading
      ) {
        setHasSubmitted(true);

        // Parse chart commands and clean the prompt
        const { cleanedPrompt } = parseChartCommands(prompt.trim());

        // Create session immediately
        const newSessionId = await createSession();

        sessionIdRef.current = newSessionId; // Update ref

        // SYNC POINT #1: Store the original prompt for display, but use cleaned prompt for processing
        const resultId = await createEmptyResult(newSessionId, prompt.trim());

        resultIdRef.current = resultId;

        // Start planning - onFinish will handle sync AND trigger batch generation
        plannerHook.submit({
          prompt: cleanedPrompt,
        });
      }
    },
    [prompt, createSession, createEmptyResult, plannerHook, batchMermaidHook]
  );

  return (
    <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
      {/* Luxurious gradient overlay for depth */}
      <div className='absolute inset-0 bg-gradient-to-br from-monochrome-charcoal/20 via-transparent to-monochrome-graphite/10 pointer-events-none' />

      <div className='relative z-10'>
        {/* Session indicator */}
        {sessionIdRef.current && (
          <div className='fixed top-4 right-4 text-xs text-monochrome-ash'>
            Session: {sessionIdRef.current.slice(0, 8)}...
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
                Turn ideas into Mermaid diagrams instantly
              </p>
            </LandingHero>
          )}

          {/* The sacred input - minimalist perfection */}
          <InputWithSubmit
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleFormSubmit}
            isProcessing={plannerHook.isLoading || batchMermaidHook.isLoading}
            autoFocus
          />
        </AnimatedInputContainer>

        {/* Results section - appears with graceful animation */}
        <ResultsSection
          show={
            plannerHook.isLoading ||
            !!(plannerHook.object && plannerHook.object.length > 0)
          }
        >
          {/* Error state - restrained and informative */}
          {plannerHook.error && (
            <ErrorState message={plannerHook.error.message} />
          )}

          {/* Processing state - minimal and sophisticated */}
          {(plannerHook.isLoading || batchMermaidHook.isLoading) && (
            <ProcessingState isPlanning={plannerHook.isLoading} />
          )}

          {/* Chart planning preview - subtle revelation */}
          {(plannerHook.isLoading ||
            (plannerHook.object && plannerHook.object.length > 0)) && (
            <PlannedChartsBadges
              plannedCharts={
                plannerHook.object?.filter(
                  (plan): plan is Plan =>
                    plan != null &&
                    typeof plan.type === 'string' &&
                    typeof plan.description === 'string'
                ) || []
              }
              isLoading={plannerHook.isLoading}
            />
          )}

          {/* Generated charts - the main revelation */}
          {(plannerHook.isLoading ||
            (plannerHook.object && plannerHook.object.length > 0)) && (
            <ChartGenerationSection>
              {plannerHook.object &&
                plannerHook.object
                  .filter(
                    (plan): plan is Plan =>
                      plan != null &&
                      typeof plan.type === 'string' &&
                      typeof plan.description === 'string'
                  )
                  .map((plan, index) => {
                    const sessionChart =
                      currentSession?.results?.[0]?.charts?.[index];
                    const currentVersionIndex =
                      sessionChart?.currentVersion || 0;
                    const currentVersion =
                      sessionChart?.versions?.[currentVersionIndex];

                    return (
                      <motion.div key={index} {...chartRevealAnimation(index)}>
                        <GeneratedChart
                          id={`chart-${index}`}
                          plan={plan}
                          chartIndex={index}
                          chart={{
                            type: plan.type,
                            description: plan.description,
                            chart:
                              batchMermaidHook.object?.results?.[index]?.chart
                                ?.chart ||
                              currentVersion?.chart ||
                              '',
                          }}
                          versions={sessionChart?.versions || []}
                          currentVersionIndex={currentVersionIndex}
                          onFixComplete={handleFixComplete}
                          onVersionChange={handleVersionChange}
                          isPlanning={plannerHook.isLoading}
                          isGenerating={batchMermaidHook.isLoading}
                        />
                      </motion.div>
                    );
                  })}
              {plannerHook.isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className='border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-3xl p-8 backdrop-blur-sm shadow-soft'
                >
                  <div className='mb-8'>
                    <Skeleton className='h-6 w-48 bg-monochrome-pewter/50 mb-3' />
                  </div>
                  <Skeleton className='h-80 w-full bg-monochrome-pewter/50' />
                </motion.div>
              )}
            </ChartGenerationSection>
          )}
        </ResultsSection>
      </div>
    </div>
  );
}
