'use client';

import { useState, useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion } from 'framer-motion';

import { chartPlanSchema as plannerSchema } from '@/app/api/planner/schema';
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
import { useFormSubmission } from '@/hooks/use-form-submission';
import { chartRevealAnimation } from '@/app/lib/animations';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    hasSaved,
    completedCharts,
    createNewSession,
    handleChartComplete,
    handleSessionCompletion,
  } = useSessionManagement();

  const {
    object: plannedCharts,
    submit,
    isLoading: isPlanning,
    error: planningError,
  } = useObject({
    api: '/api/planner',
    schema: plannerSchema,
  });

  // Track if the entire process is still running (planning + chart generation)
  const isProcessing = isPlanning || (hasSubmitted && !hasSaved);

  const handleSubmissionStart = () => {
    setHasSubmitted(true);
  };

  const { handleFormSubmit, handleKeyDown } = useFormSubmission({
    prompt,
    isProcessing,
    onSubmit: handleSubmissionStart,
    createNewSession,
    submit,
  });

  // Handle session completion and navigation
  useEffect(() => {
    if (Array.isArray(plannedCharts)) {
      handleSessionCompletion(plannedCharts, prompt);
    }
  }, [completedCharts, plannedCharts, prompt, handleSessionCompletion]);

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
            onKeyDown={handleKeyDown}
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
          {hasResults && <PlannedChartsBadges plannedCharts={plannedCharts} />}

          {/* Generated charts - the main revelation */}
          {hasResults && (
            <ChartGenerationSection>
              {plannedCharts.map((plan, index) =>
                plan ? (
                  <motion.div key={index} {...chartRevealAnimation(index)}>
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
            </ChartGenerationSection>
          )}
        </ResultsSection>
      </div>
    </div>
  );
}
