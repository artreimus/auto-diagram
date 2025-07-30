import { generateObject } from 'ai';
import { mermaidSchema, batchMermaidRequestSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import {
  createMermaidGenerationSystemPrompt,
  createMermaidGenerationUserPrompt,
} from '@/lib/prompt-utils';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the batch schema
  const validation = batchMermaidRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const { charts } = validation.data;

  const results = await Promise.all(
    charts.map(async (chartRequest) => {
      try {
        const systemPrompt = createMermaidGenerationSystemPrompt();
        const userPrompt = createMermaidGenerationUserPrompt(
          chartRequest.chartType,
          chartRequest.originalUserMessage,
          chartRequest.planDescription
        );

        const { object: chart } = await generateObject({
          model: createAIModel('fast'),
          schema: mermaidSchema,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });

        return {
          chart,
          id: nanoid(),
        };
      } catch (error) {
        throw error; // Let the error bubble up to be handled by the caller
      }
    })
  );

  return Response.json({ results });
}
