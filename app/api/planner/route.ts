import { streamObject } from 'ai';
import { plansSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { createPlannerSystemPrompt } from '@/lib/prompt-utils';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = createPlannerSystemPrompt();

  const result = streamObject({
    schema: plansSchema,
    model: createAIModel('reasoning'),
    system: systemPrompt,
    messages,
    output: 'array',
  });

  return result.toTextStreamResponse();
}
