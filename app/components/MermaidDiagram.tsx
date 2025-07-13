'use client';

import { useEffect, useRef, useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import mermaid from 'mermaid';
import { mermaidSchema } from '@/app/api/mermaid/schema';

type MermaidProps = {
  id: string;
  chart: string;
  chartType?: string;
  description?: string;
};

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

  const maxRetries = 3;

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
    });
  }, []);

  // Handle fixed chart response
  useEffect(() => {
    if (fixedChart?.chart && fixedChart.chart !== currentChart) {
      setCurrentChart(fixedChart.chart);
      setIsFixing(false);
      setLastError(null);
    }
  }, [fixedChart, currentChart]);

  const attemptFix = async (errorMessage: string) => {
    if (retryCount >= maxRetries || !chartType) {
      console.log(
        'Max retries reached or missing chartType, not attempting fix'
      );
      return;
    }

    setIsFixing(true);
    setRetryCount((prev) => prev + 1);

    try {
      await submitFix({
        chart: currentChart,
        error: errorMessage,
        chartType,
        description,
      });
    } catch (error) {
      console.error('Error submitting fix request:', error);
      setIsFixing(false);
    }
  };

  useEffect(() => {
    if (currentChart && containerRef.current) {
      mermaid
        .render(id, currentChart)
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
  }, [id, currentChart, retryCount, chartType, isFixing]);

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

  return <div ref={containerRef} />;
};

export default MermaidDiagram;
