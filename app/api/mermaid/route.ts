import { streamObject } from 'ai';
import { supportedChartTypes } from '@/lib/chart-types';
import { mermaidSchema, mermaidRequestSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';
import { createMermaidGenerationPrompt } from '@/lib/prompt-utils';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the new schema
  const validation = mermaidRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const { messages, chartType, originalUserMessage, planDescription } =
    validation.data;

  if (!supportedChartTypes.includes(chartType)) {
    return new Response(`Unsupported chart type: ${chartType}`, {
      status: 400,
    });
  }

  const systemPrompt = await createMermaidGenerationPrompt(
    chartType,
    originalUserMessage,
    planDescription
  );

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('fast', env.AI_PROVIDER),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
