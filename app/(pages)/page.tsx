'use client';

import { useState, useCallback, useRef } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';

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
import { useSessionManagement } from '@/hooks/use-session-management';
import { chartRevealAnimation } from '@/app/lib/animations';
import { ChartSource, ResultStatus } from '../enum/session';
import { Session, ChartCreation } from '@/app/validators/session';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  // Use refs to store current sessionId and plannedCharts for onFinish callbacks
  const sessionIdRef = useRef<string | null>(null);
  const plannedChartsRef = useRef<Plan[] | null>(null);
  const resultIdRef = useRef<string | null>(null);

  // Session management with event-driven sync
  const { createSession, createEmptyResult, addResult, addChartToResult } =
    useSessionManagement();

  // Pattern 1: Sequential Processing - Planner streamObject with onFinish sync
  const plannerHook = useObject({
    api: '/api/planner',
    schema: plansSchema,
    onFinish: async (result) => {
      const currentSessionId = sessionIdRef.current;

      if (currentSessionId && result.object && Array.isArray(result.object)) {
        // SYNC POINT #2: Planning complete - create result with planned charts
        try {
          // Create charts array with planned data (empty versions, currentVersion 0)
          const charts: ChartCreation[] = result.object.map((plan: Plan) => ({
            id: nanoid(),
            versions: [],
            currentVersion: 0,
            plan: plan,
          }));

          if (charts.length > 0) {
            // Create first chart with empty version
            const firstChart = {
              chart: '',
              rationale: '',
              source: ChartSource.GENERATION,
              plan: charts[0].plan,
            };

            // Create result with first chart
            const resultId = await addResult(
              currentSessionId,
              prompt.trim(),
              firstChart
            );

            // Store result ID for later updates
            resultIdRef.current = resultId;

            // Add remaining charts to the same result
            for (let i = 1; i < charts.length; i++) {
              await addChartToResult(currentSessionId, resultId, charts[i]);
            }
          }
        } catch (error) {
          console.error('Failed to create result during planning:', error);
        }

        // Store planned charts in ref for batch onFinish callback
        plannedChartsRef.current = result.object;

        // Pattern 2 Implementation: Trigger batch mermaid generation immediately
        if (result.object.length > 0) {
          batchMermaidHook.submit({
            charts: result.object.map((plan: Plan) => ({
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

  // Pattern 2: Batch mermaid generation hook with onFinish sync
  const batchMermaidHook = useObject({
    api: '/api/mermaid/batch',
    schema: batchMermaidResponseSchema,
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
          const mermaidResult = mermaidResults[index];

          if (plan && plan.type && plan.description) {
            charts.push({
              chart: mermaidResult?.chart?.chart || '',
              rationale: mermaidResult?.chart?.description || 'Generated chart',
              source: ChartSource.GENERATION,
              plan: plan,
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

            // Store result ID for chart components
            resultIdRef.current = resultId;

            // Add remaining charts to the same result
            for (let i = 1; i < charts.length; i++) {
              const chartData = {
                id: nanoid(),
                versions: [
                  {
                    version: 1,
                    chart: charts[i].chart,
                    rationale: charts[i].rationale,
                    source: charts[i].source,
                    error: undefined,
                    status: ResultStatus.COMPLETED,
                  },
                ],
                currentVersion: 0, // 0-based index for first version
                plan: charts[i].plan,
              };
              await addChartToResult(currentSessionId, resultId, chartData);
            }

            // Create session data from the results
            const sessionData: Session = {
              id: currentSessionId,
              results: [
                {
                  id: resultId,
                  prompt: prompt.trim(),
                  charts: charts.map((chartData) => ({
                    id: nanoid(),
                    versions: [
                      {
                        version: 1,
                        chart: chartData.chart,
                        rationale: chartData.rationale,
                        source: chartData.source,
                        error: undefined,
                      },
                    ],
                    currentVersion: 0, // 0-based index for first version
                    plan: chartData.plan,
                  })),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setSessionData(sessionData);
          } catch (error) {
            console.error('Failed to add result:', error);
          }
        }
      }
    },
  });

  // Handle fix completion by updating sessionData directly
  const handleFixComplete = useCallback(
    (chartIndex: number, fixedChart: string, rationale: string) => {
      if (!sessionData?.results?.[0]) return;

      setSessionData((prevSession) => {
        if (!prevSession?.results?.[0]) return prevSession;

        const updatedSession = { ...prevSession };
        const result = { ...updatedSession.results[0] };
        const charts = [...result.charts];
        const chart = { ...charts[chartIndex] };

        // Add new version to chart versions
        const newVersion =
          Math.max(...chart.versions.map((v) => v.version)) + 1;
        const newVersionData = {
          version: newVersion,
          chart: fixedChart,
          rationale,
          source: ChartSource.FIX,
          error: undefined,
        };

        chart.versions = [...chart.versions, newVersionData];
        chart.currentVersion = chart.versions.length - 1; // Use array index
        charts[chartIndex] = chart;
        result.charts = charts;
        result.updatedAt = new Date().toISOString();
        updatedSession.results = [result, ...updatedSession.results.slice(1)];
        updatedSession.updatedAt = new Date().toISOString();

        return updatedSession;
      });
    },
    [sessionData]
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

        // Create session immediately
        const newSessionId = await createSession();

        sessionIdRef.current = newSessionId; // Update ref

        // SYNC POINT #1: Store the prompt immediately by creating an empty result
        const resultId = await createEmptyResult(newSessionId, prompt.trim());

        resultIdRef.current = resultId;

        // Start planning - onFinish will handle sync AND trigger batch generation
        plannerHook.submit({
          messages: [{ role: 'user', content: prompt.trim() }],
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
                Visualize anything with AI
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
          {plannerHook.isLoading ||
            (batchMermaidHook.isLoading && (
              <ProcessingState isPlanning={plannerHook.isLoading} />
            ))}

          {/* Chart planning preview - subtle revelation */}
          {plannerHook.object && plannerHook.object.length > 0 && (
            <PlannedChartsBadges
              plannedCharts={plannerHook.object.filter(
                (plan): plan is Plan =>
                  plan != null &&
                  typeof plan.type === 'string' &&
                  typeof plan.description === 'string'
              )}
            />
          )}

          {/* Generated charts - the main revelation */}
          {plannerHook.object && plannerHook.object.length > 0 && (
            <ChartGenerationSection>
              {plannerHook.object
                .filter(
                  (plan): plan is Plan =>
                    plan != null &&
                    typeof plan.type === 'string' &&
                    typeof plan.description === 'string'
                )
                .map((plan, index) => (
                  <motion.div key={index} {...chartRevealAnimation(index)}>
                    <GeneratedChart
                      id={`chart-${index}`}
                      plan={plan}
                      chart={{
                        type: plan.type,
                        description: plan.description,
                        chart:
                          sessionData?.results?.[0]?.charts?.[index]
                            ?.versions?.[
                            sessionData.results[0].charts[index].currentVersion
                          ]?.chart || '',
                      }}
                      onFixComplete={handleFixComplete}
                      isPlanning={plannerHook.isLoading}
                      isGenerating={batchMermaidHook.isLoading}
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
