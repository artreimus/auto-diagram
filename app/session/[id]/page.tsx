'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Session } from '@/lib/session-schema';
import MermaidDiagram from '@/app/components/MermaidDiagram';

const MinimalLoadingSpinner = () => (
  <div
    className='flex items-center justify-center space-x-1'
    role='status'
    aria-live='polite'
    aria-label='Loading session'
  >
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className='w-0.5 h-0.5 bg-monochrome-pure-white rounded-full'
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: index * 0.2,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  return <SessionContent paramsPromise={params} />;
}

function SessionContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { id } = await paramsPromise;
        setSessionId(id);
      } catch (error) {
        console.error('Failed to resolve params:', error);
        setLoading(false);
      }
    };

    resolveParams();
  }, [paramsPromise]);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = () => {
      try {
        const saved = localStorage.getItem('sessions');
        if (saved) {
          const sessions: Session[] = JSON.parse(saved);
          const foundSession = sessions.find((s) => s.id === sessionId);
          setSession(foundSession || null);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='flex items-center space-x-4'>
          <MinimalLoadingSpinner />
          <span className='text-monochrome-silver font-light tracking-wide'>
            Loading session...
          </span>
        </div>
      </div>
    );
  }

  if (!session) {
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
              Session {session.id.slice(0, 8)}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className='text-sm text-monochrome-silver'
            >
              Created on {new Date(session.createdAt).toLocaleDateString()} •{' '}
              {session.results.length} result
              {session.results.length !== 1 ? 's' : ''}
            </motion.p>
          </div>

          {/* Results display */}
          <div className='grid gap-12'>
            {session.results.map((result, index) => (
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
                    <div className='mb-8'>
                      <h3 className='text-xl font-light tracking-tight text-monochrome-pure-white capitalize mb-3'>
                        Chart Result
                      </h3>
                      <div className='text-monochrome-silver font-light leading-loose text-sm tracking-wide prose prose-sm prose-invert max-w-none'>
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className='mb-3 last:mb-0 leading-loose'>{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className='font-medium text-monochrome-cloud'>
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className='italic text-monochrome-pearl'>{children}</em>
                            ),
                            code: ({ children }) => (
                              <code className='bg-monochrome-graphite/50 px-1.5 py-0.5 rounded text-monochrome-pearl font-mono text-xs'>
                                {children}
                              </code>
                            ),
                            ul: ({ children }) => (
                              <ul className='list-disc list-inside space-y-1.5 mb-3'>
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className='list-decimal list-inside space-y-1.5 mb-3'>
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className='text-sm leading-loose'>{children}</li>
                            ),
                            h1: ({ children }) => (
                              <h1 className='text-lg font-medium text-monochrome-pure-white mb-3 mt-4 first:mt-0'>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className='text-base font-medium text-monochrome-pure-white mb-2 mt-3 first:mt-0'>
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className='text-sm font-medium text-monochrome-cloud mb-2 mt-3 first:mt-0'>
                                {children}
                              </h3>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className='border-l-2 border-monochrome-pewter/30 pl-4 italic text-monochrome-silver/90 mb-3'>
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {result.charts[result.currentVersion - 1]?.plan?.description || result.prompt}
                        </ReactMarkdown>
                      </div>

                      {/* Generation history info */}
                      {result.charts.length > 1 && (
                        <div className='mt-4 p-3 bg-monochrome-graphite/30 rounded-xl border border-monochrome-pewter/20'>
                          <p className='text-xs text-monochrome-ash mb-2'>
                            Generation History: {result.charts.length} version
                            {result.charts.length !== 1 ? 's' : ''}
                          </p>
                          {result.charts.map((chartVersion, chartIndex) => (
                            <div
                              key={chartIndex}
                              className='text-xs text-monochrome-silver/70 mb-1'
                            >
                              Version {chartVersion.version}:{' '}
                              {chartVersion.source}
                              {chartVersion.error && (
                                <span className='ml-2 text-monochrome-ash'>
                                  • {chartVersion.error}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      {/* Show the current version */}
                      {result.charts[result.currentVersion - 1] && (
                        <MermaidDiagram
                          key={`${result.id}-${result.currentVersion}`}
                          id={`session-${session.id}-${result.id}`}
                          chart={result.charts[result.currentVersion - 1].chart}
                          onRenderError={() => {}}
                        />
                      )}
                    </motion.div>
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
