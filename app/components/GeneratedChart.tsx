'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { nanoid } from 'nanoid';
import MermaidDiagram from './MermaidDiagram';
import { mermaidSchema } from '@/app/api/mermaid/schema';
import { ChartPlan } from '@/app/api/planner/schema';
import { DeepPartial } from 'ai';
import { useEffect } from 'react';

export function GeneratedChart({ plan }: { plan: DeepPartial<ChartPlan> }) {
  const {
    object: chart,
    error,
    submit,
    isLoading,
  } = useObject({
    api: '/api/mermaid',
    schema: mermaidSchema,
  });

  useEffect(() => {
    if (plan.type && plan.description && !isLoading && !chart) {
      submit({
        messages: [{ role: 'user', content: plan.description }],
        chartType: plan.type,
      });
    }
  }, [plan.type, plan.description, submit, isLoading, chart]);

  if (error) {
    return (
      <div
        className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6'
        role='alert'
      >
        <strong className='font-bold'>Error generating chart:</strong>
        <span className='block sm:inline ml-2'>
          {error instanceof Error ? error.message : JSON.stringify(error)}
        </span>
      </div>
    );
  }

  return (
    <div className='border rounded-lg p-4'>
      <h3 className='text-lg font-semibold capitalize mb-2'>
        {chart?.type ?? plan.type ?? 'Loading...'} Chart
      </h3>
      <p className='text-sm text-gray-500 mb-2'>
        {chart?.description ?? plan.description ?? 'Generating...'}
      </p>
      {chart?.chart ? (
        <MermaidDiagram id={nanoid()} chart={chart.chart} />
      ) : (
        <div className='flex items-center justify-center p-8 min-h-[200px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-2 text-gray-600 dark:text-gray-300'>
            Generating chart...
          </span>
        </div>
      )}
    </div>
  );
}
