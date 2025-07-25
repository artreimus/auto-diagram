import { generateObject } from 'ai';
import { mermaidSchema, mermaidFixRequestSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';
import { createMermaidFixPrompt } from '@/lib/prompt-utils';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the new schema
  const validation = mermaidFixRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const {
    chart,
    error,
    chartType,
    description,
    originalUserMessage,
    planDescription,
    previousAttempts,
  } = validation.data;

  const systemPrompt = await createMermaidFixPrompt(
    chartType,
    chart,
    error,
    originalUserMessage,
    planDescription,
    description,
    previousAttempts
  );

  const { object: fixedChart } = await generateObject({
    model: createAIModel('reasoning', env.AI_PROVIDER),
    schema: mermaidSchema,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please fix ONLY the syntax errors in this Mermaid chart. Do not change the content or meaning. The error was: ${error}${
          previousAttempts && previousAttempts.length > 0
            ? `\n\nThis is attempt ${previousAttempts.length + 1}. Previous syntax fix attempts have failed, so please try a different technical approach to fix the syntax while keeping the content identical.`
            : ''
        }`,
      },
    ],
  });

  return Response.json(fixedChart);
}
