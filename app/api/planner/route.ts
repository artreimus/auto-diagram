import { streamObject } from 'ai';
import { plannerSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';
import { createPlannerPrompt } from '@/lib/prompt-utils';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = await createPlannerPrompt();

  const result = streamObject({
    schema: plannerSchema,
    model: createAIModel('reasoning', env.AI_PROVIDER),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
