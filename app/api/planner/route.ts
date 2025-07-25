import { streamObject } from 'ai';
import { plannerElementSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';
import { createPlannerPrompt } from '@/lib/prompt-utils';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = await createPlannerPrompt();

  const result = streamObject({
    schema: plannerElementSchema,
    model: createAIModel('reasoning', env.AI_PROVIDER),
    system: systemPrompt,
    messages,
    output: 'array',
  });

  return result.toTextStreamResponse();
}
