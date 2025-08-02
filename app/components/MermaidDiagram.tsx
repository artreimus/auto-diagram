'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

type MermaidProps = {
  id: string;
  chart: string;
  description?: string;
  onFixClick?: (errorMessage?: string) => void;
  isFixing?: boolean;
};

const MermaidDiagram = ({
  id,
  chart,
  description: planDescription,
  onFixClick,
  isFixing = false,
}: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Ensure the ID is a valid CSS selector
  const validId = `mermaid-${id.replace(/[^a-zA-Z0-9-_]/g, '').replace(/^[0-9]/, 'n$&')}`;

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
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(encodeURIComponent(svgString))}`;

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
        }
      };

      img.onerror = () => {
        console.error('Error loading SVG');
      };

      img.src = svgDataUrl;
    } catch (error) {
      console.error('Error in downloadChart:', error);
    }
  }, [id]);

  // Copy syntax with elegant feedback
  const copySyntax = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy syntax:', error);
    }
  }, [chart]);

  useEffect(() => {
    if (!chart || !containerRef.current) {
      return;
    }

    let isStale = false;
    containerRef.current.innerHTML = '';

    mermaid
      .render(validId, chart)
      .then(({ svg, bindFunctions }) => {
        if (containerRef.current && !isStale) {
          containerRef.current.innerHTML = svg;
          if (bindFunctions) {
            bindFunctions(containerRef.current);
          }
          setRenderError(null);
        }
      })
      .catch((error) => {
        if (isStale) {
          return;
        }
        const errorMessage =
          error?.message || String(error) || 'Chart rendering failed';
        console.error('Mermaid render error:', error);
        setRenderError(errorMessage);
      });
    return () => {
      isStale = true;
    };
  }, [validId, chart]);

  return (
    <div className='space-y-6'>
      {/* Refined action controls */}
      <div className='flex justify-end gap-3'>
        {!renderError && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadChart}
            className='text-sm text-monochrome-silver hover:text-monochrome-cloud font-light tracking-wide px-4 py-2 rounded-xl border border-monochrome-pewter/30 hover:border-monochrome-silver/40 bg-monochrome-charcoal/10 hover:bg-monochrome-graphite/20 transition-all duration-200 backdrop-blur-sm'
          >
            Export PNG
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSyntax(!showSyntax)}
          className='text-sm text-monochrome-silver hover:text-monochrome-cloud font-light tracking-wide px-4 py-2 rounded-xl border border-monochrome-pewter/30 hover:border-monochrome-silver/40 bg-monochrome-charcoal/10 hover:bg-monochrome-graphite/20 transition-all duration-200 backdrop-blur-sm'
        >
          {showSyntax ? 'Hide' : 'View'} Source
        </motion.button>
      </div>

      {/* Syntax display with sophisticated styling and ReactMarkdown */}
      <AnimatePresence>
        {showSyntax && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className='border border-monochrome-pewter/20 bg-monochrome-charcoal/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg'
          >
            <div className='px-6 py-4 border-b border-monochrome-pewter/20 bg-monochrome-graphite/10 flex justify-between items-center'>
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
            <div className='max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-monochrome-charcoal/10 scrollbar-thumb-monochrome-pewter/30 hover:scrollbar-thumb-monochrome-pewter/50'>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className='p-6 max-w-none'
              >
                <ReactMarkdown
                  components={{
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) {
                        return (
                          <pre className='bg-monochrome-graphite/20 rounded-lg p-4 overflow-x-auto text-sm font-mono text-monochrome-silver leading-relaxed whitespace-pre-wrap break-words'>
                            <code className='text-monochrome-silver'>
                              {children}
                            </code>
                          </pre>
                        );
                      }
                      return (
                        <code className='bg-monochrome-graphite/30 px-2 py-1 rounded text-monochrome-pearl font-mono text-xs'>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <div className='bg-monochrome-graphite/20 rounded-lg p-4 overflow-x-auto'>
                        {children}
                      </div>
                    ),
                    p: ({ children }) => (
                      <p className='mb-3 last:mb-0 text-monochrome-silver leading-relaxed'>
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className='font-medium text-monochrome-cloud'>
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className='italic text-monochrome-pearl'>
                        {children}
                      </em>
                    ),
                    h1: ({ children }) => (
                      <h1 className='text-lg font-medium text-monochrome-pure-white mb-4 mt-6 first:mt-0'>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className='text-base font-medium text-monochrome-pure-white mb-3 mt-5 first:mt-0'>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className='text-sm font-medium text-monochrome-cloud mb-2 mt-4 first:mt-0'>
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className='list-disc list-inside space-y-2 mb-4 text-monochrome-silver'>
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className='list-decimal list-inside space-y-2 mb-4 text-monochrome-silver'>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className='text-sm leading-relaxed'>{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className='border-l-3 border-monochrome-pewter/40 pl-4 italic text-monochrome-silver/90 mb-4 bg-monochrome-charcoal/10 py-2 rounded-r-lg'>
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {`\`\`\`mermaid\n${chart}\n\`\`\``}
                </ReactMarkdown>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state with fix button */}
      {renderError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className='border border-red-500/30 bg-red-500/5 rounded-2xl p-6 backdrop-blur-sm'
        >
          <div className='flex items-start space-x-3 mb-4'>
            <div className='w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0' />
            <div className='flex-1'>
              <p className='text-monochrome-cloud font-medium mb-1'>
                Chart rendering failed
              </p>
              <p className='text-sm text-monochrome-silver font-light mb-4'>
                {renderError}
              </p>

              <div className='flex gap-3'>
                {onFixClick && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onFixClick?.(renderError || undefined)}
                    disabled={isFixing}
                    className={`text-sm font-medium tracking-wide px-4 py-2 rounded-xl border transition-all duration-200 backdrop-blur-sm ${
                      isFixing
                        ? 'text-monochrome-ash border-monochrome-pewter/20 bg-monochrome-graphite/10 cursor-not-allowed'
                        : 'text-monochrome-pure-white hover:text-monochrome-cloud border-monochrome-silver/40 hover:border-monochrome-cloud/60 bg-monochrome-graphite/30 hover:bg-monochrome-slate-dark/40'
                    }`}
                  >
                    {isFixing ? (
                      <span className='flex items-center space-x-2'>
                        <div className='w-3 h-3 border border-monochrome-ash border-t-transparent rounded-full animate-spin' />
                        <span>Fixing...</span>
                      </span>
                    ) : (
                      'Fix Chart'
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* Chart container with custom monochrome styling applied via CSS variables */}
      {!renderError && (
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
      )}
    </div>
  );
};

export default MermaidDiagram;
