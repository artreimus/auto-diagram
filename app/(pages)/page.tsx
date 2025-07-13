'use client';

import { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chartPlanSchema as plannerSchema } from '@/app/api/planner/schema';
import { GeneratedChart } from '../components/GeneratedChart';

export default function DemoPage() {
  const [prompt, setPrompt] = useState('');

  const {
    object: plannedCharts,
    submit,
    isLoading: isPlanning,
    error: planningError,
  } = useObject({
    api: '/api/planner',
    schema: plannerSchema,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit({ messages: [{ role: 'user', content: prompt }] });
  };

  const error = planningError
    ? 'Error planning charts. Please try again.'
    : null;

  return (
    <div className='container mx-auto p-4 md:p-8'>
      <h1 className='text-3xl font-bold mb-6 text-center'>
        Mermaid Chart Generator
      </h1>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col sm:flex-row gap-4 mb-8'
      >
        <Input
          type='text'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Enter a prompt to generate charts...'
          className='flex-grow'
          disabled={isPlanning}
        />
        <Button type='submit' disabled={isPlanning}>
          {isPlanning ? 'Planning...' : 'Generate'}
        </Button>
      </form>

      {error && (
        <div
          className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6'
          role='alert'
        >
          <strong className='font-bold'>Error:</strong>
          <span className='block sm:inline ml-2'>{error}</span>
        </div>
      )}

      {Array.isArray(plannedCharts) && plannedCharts.length > 0 && (
        <div className='mb-6'>
          <h2 className='text-xl font-semibold mb-2'>Planned Charts:</h2>
          <div className='flex flex-col gap-2'>
            {plannedCharts.map((plan, index) =>
              plan && plan.type && plan.description ? (
                <div key={index} className='flex items-center gap-2'>
                  <Badge variant='secondary'>{plan.type}</Badge>
                  <span>{plan.description}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {Array.isArray(plannedCharts) && plannedCharts.length > 0 && (
        <div>
          <h2 className='text-2xl font-bold mb-4'>Generated Charts</h2>
          <div className='grid gap-8'>
            {plannedCharts.map((plan, index) =>
              plan ? <GeneratedChart key={index} plan={plan} /> : null
            )}
          </div>
        </div>
      )}
      {isPlanning && (
        <div className='flex items-center justify-center p-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-2 text-gray-600 dark:text-gray-300'>
            Planning...
          </span>
        </div>
      )}
    </div>
  );
}
