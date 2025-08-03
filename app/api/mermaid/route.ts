import { streamObject } from 'ai';
import { mermaidSchema, mermaidRequestSchema } from './schema';
import { createAIModel } from '@/app/lib/ai-provider';
import {
  createMermaidGenerationSystemPrompt,
  createMermaidGenerationUserPrompt,
} from '@/app/lib/prompt-utils';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the new schema
  const validation = mermaidRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const { chartType, originalUserMessage, planDescription } = validation.data;

  const systemPrompt = createMermaidGenerationSystemPrompt();
  const userPrompt = createMermaidGenerationUserPrompt(
    chartType,
    originalUserMessage,
    planDescription
  );

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('fast'),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  return result.toTextStreamResponse();
}
