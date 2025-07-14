'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Elegant loading animation for fix attempts
const FixingSpinner = ({
  attempt,
  maxRetries,
}: {
  attempt: number;
  maxRetries: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className='flex items-center justify-center py-16 px-8 border border-monochrome-pewter/20 bg-monochrome-charcoal/10 rounded-2xl backdrop-blur-sm'
  >
    <div className='flex items-center space-x-4'>
      <div className='flex space-x-1'>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className='w-1.5 h-1.5 bg-monochrome-silver rounded-full'
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className='text-monochrome-silver font-light tracking-wide text-sm'>
        Refining syntax{' '}
        <span className='text-monochrome-ash'>
          ({attempt}/{maxRetries})
        </span>
      </span>
    </div>
  </motion.div>
);

const MermaidDiagram = ({
  id,
  chart,
  chartType,
  description,
}: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentChart, setCurrentChart] = useState(chart);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<FixAttempt[]>([]);
  const [showSyntax, setShowSyntax] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const maxRetries = 3;

  // Ensure the ID is a valid CSS selector
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
    // Initialize Mermaid with our sophisticated monochrome theme
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily:
        'ui-sans-serif, -apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, Arial, sans-serif',
      // Custom monochrome theme variables
      themeVariables: {
        // Core background and text
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#2a2a2a',
        lineColor: '#4a4a4a',

        // Node styling
        background: '#ffffff',
        mainBkg: '#f8f8f8',
        secondBkg: '#e0e0e0',
        tertiaryColor: '#c8c8c8',

        // Text and labels
        textColor: '#1a1a1a',
        darkTextColor: '#000000',
        labelTextColor: '#2a2a2a',

        // Borders and connectors
        stroke: '#3a3a3a',
        fill: '#ffffff',
        edgeLabelBackground: '#ffffff',

        // Specialized diagram colors
        classText: '#1a1a1a',
        fillType0: '#ffffff',
        fillType1: '#f0f0f0',
        fillType2: '#e0e0e0',
        fillType3: '#c8c8c8',
        fillType4: '#b0b0b0',
        fillType5: '#9a9a9a',
        fillType6: '#8a8a8a',
        fillType7: '#6a6a6a',

        // State and sequence diagrams
        actorBkg: '#f8f8f8',
        actorBorder: '#2a2a2a',
        actorTextColor: '#1a1a1a',
        actorLineColor: '#4a4a4a',
        signalColor: '#2a2a2a',
        signalTextColor: '#1a1a1a',

        // Special elements
        cScale0: '#ffffff',
        cScale1: '#f0f0f0',
        cScale2: '#e0e0e0',
        cScale3: '#c8c8c8',
        cScale4: '#b0b0b0',
        cScale5: '#9a9a9a',
        cScale6: '#8a8a8a',
        cScale7: '#6a6a6a',
        cScale8: '#4a4a4a',
        cScale9: '#2a2a2a',
        cScaleInv0: '#000000',
        cScaleInv1: '#1a1a1a',
        cScaleInv2: '#2a2a2a',
        cScaleInv3: '#3a3a3a',
        cScaleInv4: '#4a4a4a',
        cScaleInv5: '#5a5a5a',
        cScaleInv6: '#6a6a6a',
        cScaleInv7: '#8a8a8a',
        cScaleInv8: '#9a9a9a',
        cScaleInv9: '#b0b0b0',
      },
      mindmap: { padding: 16 },
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'linear' },
      sequence: { useMaxWidth: true, wrap: true },
      gantt: { useMaxWidth: true },
      journey: { useMaxWidth: true },
      timeline: { useMaxWidth: true },
      class: { useMaxWidth: true },
      state: { useMaxWidth: true },
    });
  }, []);

  // Handle fixed chart response
  useEffect(() => {
    if (fixedChart?.chart && fixedChart.chart !== currentChart) {
      // A fix has been returned.
      setCurrentChart(fixedChart.chart);
      setLastError(null);

      if (fixedChart.explanation) {
        console.log('Chart refined successfully:', fixedChart.explanation);
        // Update the last attempt with the explanation from the server
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

  // When the component receives a new chart prop, reset its state.
  useEffect(() => {
    setCurrentChart(chart);
    setRetryCount(0);
    setLastError(null);
    setPreviousAttempts([]);
  }, [chart]);

  // Download chart as PNG with sophisticated styling
  const downloadChart = useCallback(() => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      const svgRect = svgElement.getBoundingClientRect();
      const width = svgRect.width || 800;
      const height = svgRect.height || 600;

      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());

      // Inject our refined monochrome styles
      const style = document.createElement('style');
      style.textContent = `
        * {
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 400;
        }
        .node rect, .node circle, .node ellipse, .node polygon {
          fill: #ffffff;
          stroke: #2a2a2a;
          stroke-width: 1.5px;
        }
        .edgePath path {
          stroke: #3a3a3a;
          stroke-width: 1.5px;
          fill: none;
        }
        .edgeLabel {
          background-color: #ffffff;
          color: #1a1a1a;
        }
        text {
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          fill: #1a1a1a;
          font-weight: 400;
        }
        .actor {
          fill: #f8f8f8;
          stroke: #2a2a2a;
        }
        .messageLine0, .messageLine1 {
          stroke: #2a2a2a;
        }
      `;
      clonedSvg.insertBefore(style, clonedSvg.firstChild);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `visualization-${id}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            },
            'image/png',
            0.95
          );
        } catch (error) {
          console.error('Error rendering canvas:', error);
          downloadSvgFallback(svgString);
        }
      };

      img.onerror = () => {
        console.error('Error loading SVG');
        downloadSvgFallback(svgString);
      };

      img.src = svgDataUrl;
    } catch (error) {
      console.error('Error in downloadChart:', error);
      const svgData = new XMLSerializer().serializeToString(svgElement);
      downloadSvgFallback(svgData);
    }
  }, [id]);

  // Fallback SVG download
  const downloadSvgFallback = useCallback(
    (svgString: string) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization-${id}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [id]
  );

  // Copy syntax with elegant feedback
  const copySyntax = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentChart);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy syntax:', error);
    }
  }, [currentChart]);

  useEffect(() => {
    if (!currentChart || !containerRef.current) {
      return;
    }

    // Don't try to render if a fix is in progress.
    if (isLoadingFix) {
      return;
    }

    let isStale = false;
    containerRef.current.innerHTML = '';

    const attemptFix = async (errorMessage: string) => {
      if (isLoadingFix || retryCount >= maxRetries || !chartType) {
        return;
      }

      const currentRetryCount = retryCount + 1;
      setRetryCount(currentRetryCount);

      const failedAttempt: FixAttempt = {
        chart: currentChart,
        error: errorMessage,
      };
      // Store the attempt immediately
      const newAttempts = [...previousAttempts, failedAttempt];
      setPreviousAttempts(newAttempts);

      try {
        await submitFix({
          chart: currentChart,
          error: errorMessage,
          chartType,
          description,
          previousAttempts: newAttempts,
        });
      } catch (error) {
        console.error('Error submitting refinement request:', error);
      }
    };

    mermaid
      .render(validId, currentChart)
      .then(({ svg, bindFunctions }) => {
        if (containerRef.current && !isStale && !isLoadingFix) {
          containerRef.current.innerHTML = svg;
          if (bindFunctions) {
            bindFunctions(containerRef.current);
          }
          setLastError(null);
          // Reset retry count on success
          if (retryCount > 0) {
            setRetryCount(0);
          }
        }
      })
      .catch((error) => {
        if (isStale || isLoadingFix) {
          return;
        }

        const errorMessage = error.message || error.toString();
        console.error('Error rendering visualization:', error);

        if (retryCount < maxRetries) {
          attemptFix(errorMessage);
        } else {
          // Retries exhausted, show final error
          setLastError(errorMessage);
          if (containerRef.current) {
            const showRetryInfo = retryCount > 0;
            containerRef.current.innerHTML = `
                <div class="text-monochrome-silver p-6 border border-monochrome-pewter/30 bg-monochrome-charcoal/10 rounded-2xl backdrop-blur-sm">
                  <p class="font-medium text-monochrome-cloud mb-2">Visualization Error${showRetryInfo ? ` (after ${retryCount} refinement attempts)` : ''}</p>
                  <p class="text-sm mb-4 font-light">${errorMessage}</p>
                  ${showRetryInfo ? '<p class="text-xs text-monochrome-ash">Auto-refinement attempts exhausted.</p>' : ''}
                  <details class="mt-4">
                    <summary class="text-sm cursor-pointer hover:text-monochrome-cloud transition-colors font-medium">View source code</summary>
                    <pre class="mt-3 text-xs whitespace-pre-wrap bg-monochrome-graphite/20 p-4 rounded-xl font-mono text-monochrome-pearl">${currentChart}</pre>
                  </details>
                </div>
              `;
          }
        }
      });
    return () => {
      isStale = true;
    };
  }, [
    validId,
    currentChart,
    chartType,
    description,
    retryCount,
    maxRetries,
    isLoadingFix,
    submitFix,
    previousAttempts,
  ]);

  // Show fixing state
  if (isLoadingFix) {
    return <FixingSpinner attempt={retryCount} maxRetries={maxRetries} />;
  }

  // Show fix submission error
  if (fixError && !isLoadingFix) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className='border border-monochrome-steel/30 bg-monochrome-charcoal/20 rounded-2xl p-6 backdrop-blur-sm'
      >
        <div className='flex items-start space-x-3 mb-4'>
          <div className='w-1.5 h-1.5 bg-monochrome-ash rounded-full mt-2 flex-shrink-0' />
          <div>
            <p className='text-monochrome-cloud font-medium mb-1'>
              Refinement process encountered an issue
            </p>
            <p className='text-sm text-monochrome-silver font-light mb-2'>
              Fix error: {fixError.message || 'Unknown error'}
            </p>
            <p className='text-sm text-monochrome-ash font-light'>
              Original error: {lastError}
            </p>
          </div>
        </div>

        {previousAttempts.length > 0 && (
          <details className='mt-4'>
            <summary className='text-sm cursor-pointer hover:text-monochrome-cloud transition-colors font-medium text-monochrome-silver'>
              Previous refinement attempts ({previousAttempts.length})
            </summary>
            <div className='mt-3 space-y-3 max-h-40 overflow-auto'>
              {previousAttempts.map((attempt, index) => (
                <div
                  key={index}
                  className='bg-monochrome-graphite/20 p-3 rounded-xl'
                >
                  <p className='font-medium text-sm text-monochrome-cloud'>
                    Attempt {index + 1}:
                  </p>
                  <p className='text-xs text-monochrome-silver mt-1'>
                    Error: {attempt.error}
                  </p>
                  {attempt.explanation && (
                    <p className='text-xs text-monochrome-ash mt-1'>
                      Strategy: {attempt.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        <details className='mt-4'>
          <summary className='text-sm cursor-pointer hover:text-monochrome-cloud transition-colors font-medium text-monochrome-silver'>
            View source code
          </summary>
          <pre className='mt-3 text-xs whitespace-pre-wrap bg-monochrome-graphite/20 p-4 rounded-xl font-mono text-monochrome-pearl'>
            {currentChart}
          </pre>
        </details>
      </motion.div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Success message when chart was auto-fixed */}
      <AnimatePresence>
        {fixedChart?.explanation && retryCount > 0 && !isLoadingFix && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className='border border-monochrome-pewter/30 bg-monochrome-charcoal/10 rounded-2xl p-4 backdrop-blur-sm'
          >
            <div className='flex items-start space-x-3'>
              <div className='w-1.5 h-1.5 bg-monochrome-pearl rounded-full mt-2 flex-shrink-0' />
              <div>
                <p className='font-medium text-sm text-monochrome-cloud mb-1'>
                  Visualization refined (attempt {retryCount})
                </p>
                <p className='text-sm text-monochrome-silver font-light'>
                  {fixedChart.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refined action controls */}
      <div className='flex justify-end gap-3'>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadChart}
          className='text-sm text-monochrome-silver hover:text-monochrome-cloud font-light tracking-wide px-4 py-2 rounded-xl border border-monochrome-pewter/30 hover:border-monochrome-silver/40 bg-monochrome-charcoal/10 hover:bg-monochrome-graphite/20 transition-all duration-200 backdrop-blur-sm'
        >
          Export PNG
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSyntax(!showSyntax)}
          className='text-sm text-monochrome-silver hover:text-monochrome-cloud font-light tracking-wide px-4 py-2 rounded-xl border border-monochrome-pewter/30 hover:border-monochrome-silver/40 bg-monochrome-charcoal/10 hover:bg-monochrome-graphite/20 transition-all duration-200 backdrop-blur-sm'
        >
          {showSyntax ? 'Hide' : 'View'} Source
        </motion.button>
      </div>

      {/* Syntax display with sophisticated styling */}
      <AnimatePresence>
        {showSyntax && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='border border-monochrome-pewter/20 bg-monochrome-charcoal/5 rounded-2xl overflow-hidden backdrop-blur-sm'
          >
            <div className='px-6 py-3 border-b border-monochrome-pewter/20 bg-monochrome-graphite/10 flex justify-between items-center'>
              <span className='text-sm font-medium text-monochrome-cloud tracking-wide'>
                Mermaid Source Code
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copySyntax}
                className='text-xs text-monochrome-silver hover:text-monochrome-cloud font-light tracking-wide px-3 py-1.5 rounded-lg border border-monochrome-pewter/30 hover:border-monochrome-silver/40 bg-monochrome-charcoal/20 hover:bg-monochrome-graphite/30 transition-all duration-200'
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
            <pre className='p-6 text-sm whitespace-pre-wrap font-mono text-monochrome-silver leading-relaxed overflow-auto max-h-80'>
              {currentChart}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart container with custom monochrome styling applied via CSS variables */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        ref={containerRef}
        className='mermaid-container bg-monochrome-pure-white rounded-2xl p-8 border border-monochrome-pewter/20 shadow-soft overflow-auto'
        style={
          {
            // Custom CSS variables for enhanced monochrome styling
            '--mermaid-font-family':
              'ui-sans-serif, -apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, Arial, sans-serif',
            '--mermaid-font-size': '14px',
            '--mermaid-primary-color': '#ffffff',
            '--mermaid-primary-text-color': '#1a1a1a',
            '--mermaid-primary-border-color': '#2a2a2a',
            '--mermaid-line-color': '#3a3a3a',
          } as React.CSSProperties
        }
      />
    </div>
  );
};

export default MermaidDiagram;
