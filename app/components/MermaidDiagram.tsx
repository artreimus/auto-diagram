'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import mermaid from 'mermaid';
import { mermaidSchema } from '@/app/api/mermaid/schema';

type MermaidProps = {
  id: string;
  chart: string;
  chartType?: string;
  description?: string;
};

interface FixAttempt {
  chart: string;
  error: string;
  explanation?: string;
}

const MermaidDiagram = ({
  id,
  chart,
  chartType,
  description,
}: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentChart, setCurrentChart] = useState(chart);
  const [retryCount, setRetryCount] = useState(0);
  const [isFixing, setIsFixing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<FixAttempt[]>([]);

  const maxRetries = 3;

  // Ensure the ID is a valid CSS selector (starts with letter, no invalid chars)
  const validId = `mermaid-${id.replace(/[^a-zA-Z0-9-_]/g, '').replace(/^[0-9]/, 'n$&')}`;

  const {
    object: fixedChart,
    submit: submitFix,
    isLoading: isLoadingFix,
    error: fixError,
  } = useObject({
    api: '/api/mermaid/fix',
    schema: mermaidSchema,
  });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose', // Allow more flexible rendering
      fontFamily: 'inherit',
      mindmap: {
        padding: 10,
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
      class: {
        useMaxWidth: true,
      },
      state: {
        useMaxWidth: true,
      },
    });
  }, []);

  // Handle fixed chart response
  useEffect(() => {
    if (fixedChart?.chart && fixedChart.chart !== currentChart) {
      setCurrentChart(fixedChart.chart);
      setIsFixing(false);
      setLastError(null);

      // Log the successful fix explanation if available
      if (fixedChart.explanation) {
        console.log('Chart fixed successfully:', fixedChart.explanation);

        // Update the last attempt in previousAttempts with the successful explanation
        setPreviousAttempts((prev) => {
          if (prev.length > 0) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              explanation: fixedChart.explanation,
            };
            return updated;
          }
          return prev;
        });
      }
    }
  }, [fixedChart, currentChart]);

  // Reset chart when the original chart prop changes
  useEffect(() => {
    if (chart !== currentChart) {
      setCurrentChart(chart);
      setRetryCount(0);
      setIsFixing(false);
      setLastError(null);
      setPreviousAttempts([]); // Reset previous attempts for new chart
    }
  }, [chart, currentChart]);

  const attemptFix = useCallback(
    async (errorMessage: string) => {
      if (retryCount >= maxRetries || !chartType) {
        console.log(
          'Max retries reached or missing chartType, not attempting fix'
        );
        return;
      }

      // Store the current failed attempt before trying to fix
      const failedAttempt: FixAttempt = {
        chart: currentChart,
        error: errorMessage,
      };

      setIsFixing(true);
      setRetryCount((prev) => prev + 1);

      try {
        await submitFix({
          chart: currentChart,
          error: errorMessage,
          chartType,
          description,
          previousAttempts, // Pass previous attempts for context
        });

        // Add the failed attempt to our history after submitting the fix request
        setPreviousAttempts((prev) => [...prev, failedAttempt]);
      } catch (error) {
        console.error('Error submitting fix request:', error);
        setIsFixing(false);

        // Still add the failed attempt to history even if fix request fails
        setPreviousAttempts((prev) => [...prev, failedAttempt]);
      }
    },
    [
      retryCount,
      maxRetries,
      chartType,
      currentChart,
      description,
      previousAttempts,
      submitFix,
    ]
  );

  useEffect(() => {
    if (currentChart && containerRef.current) {
      // Clear the container first
      containerRef.current.innerHTML = '';

      mermaid
        .render(validId, currentChart)
        .then(({ svg, bindFunctions }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            if (bindFunctions) {
              bindFunctions(containerRef.current);
            }
            // Reset retry count on successful render
            setRetryCount(0);
            setLastError(null);
          }
        })
        .catch((error) => {
          const errorMessage = error.message || error.toString();
          console.error('Error rendering Mermaid chart:', error);
          setLastError(errorMessage);

          // Attempt to fix the chart if we haven't exceeded max retries
          if (retryCount < maxRetries && chartType && !isFixing) {
            console.log(
              `Attempting to fix chart (attempt ${retryCount + 1}/${maxRetries})`
            );
            attemptFix(errorMessage);
          } else {
            // Show error if we can't or won't try to fix
            if (containerRef.current) {
              const showRetryInfo = retryCount > 0;
              containerRef.current.innerHTML = `
                <div class="text-red-400 p-4 border border-red-400 rounded-lg">
                  <p class="font-bold">Error rendering chart${showRetryInfo ? ` (after ${retryCount} fix attempts)` : ''}.</p>
                  <p class="text-sm mt-1">Error: ${errorMessage}</p>
                  ${showRetryInfo ? '<p class="text-xs mt-2 text-red-300">Auto-fix attempts exhausted.</p>' : ''}
                  <details class="mt-2">
                    <summary class="text-sm cursor-pointer hover:text-red-300">Show chart code</summary>
                    <pre class="mt-2 text-xs whitespace-pre-wrap bg-red-900/20 p-2 rounded">${currentChart}</pre>
                  </details>
                </div>
              `;
            }
          }
        });
    }
  }, [validId, currentChart, retryCount, chartType, isFixing, attemptFix]);

  // Show fixing state
  if (isFixing || isLoadingFix) {
    return (
      <div className='flex items-center justify-center p-8 min-h-[200px] border border-yellow-400 rounded-lg bg-yellow-50 dark:bg-yellow-900/20'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600'></div>
        <span className='ml-2 text-yellow-700 dark:text-yellow-300'>
          Fixing chart syntax... (attempt {retryCount}/{maxRetries})
        </span>
      </div>
    );
  }

  // Show fix error if fixing failed
  if (fixError && !isLoadingFix) {
    return (
      <div className='text-red-400 p-4 border border-red-400 rounded-lg'>
        <p className='font-bold'>Error fixing chart syntax.</p>
        <p className='text-sm mt-1'>
          Fix error: {fixError.message || 'Unknown error'}
        </p>
        <p className='text-sm mt-1'>Original error: {lastError}</p>
        {previousAttempts.length > 0 && (
          <details className='mt-2'>
            <summary className='text-sm cursor-pointer hover:text-red-300'>
              Previous fix attempts ({previousAttempts.length})
            </summary>
            <div className='mt-2 text-xs space-y-2 max-h-40 overflow-auto'>
              {previousAttempts.map((attempt, index) => (
                <div key={index} className='bg-red-900/20 p-2 rounded'>
                  <p className='font-semibold'>Attempt {index + 1}:</p>
                  <p>Error: {attempt.error}</p>
                  {attempt.explanation && (
                    <p>Fix attempted: {attempt.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
        <details className='mt-2'>
          <summary className='text-sm cursor-pointer hover:text-red-300'>
            Show chart code
          </summary>
          <pre className='mt-2 text-xs whitespace-pre-wrap bg-red-900/20 p-2 rounded'>
            {currentChart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {/* Show success message when chart was auto-fixed */}
      {fixedChart?.explanation && retryCount > 0 && (
        <div className='text-green-600 dark:text-green-400 p-3 border border-green-400 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm'>
          <p className='font-semibold'>
            ✅ Chart auto-fixed (attempt {retryCount}):
          </p>
          <p className='mt-1'>{fixedChart.explanation}</p>
        </div>
      )}

      <div ref={containerRef} className='mermaid-container' />
    </div>
  );
};

export default MermaidDiagram;
