import { generateObject } from 'ai';
import { mermaidSchema, mermaidFixRequestSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import {
  createMermaidFixSystemPrompt,
  createMermaidFixUserPrompt,
} from '@/lib/prompt-utils';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the new schema
  const validation = mermaidFixRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const { chart, error, chartType, planDescription } = validation.data;

  const systemPrompt = createMermaidFixSystemPrompt();
  const userPrompt = createMermaidFixUserPrompt(
    chartType,
    chart,
    error,
    planDescription
  );

  const { object: fixedChart } = await generateObject({
    model: createAIModel('reasoning'),
    schema: mermaidSchema,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  return Response.json(fixedChart);
}
