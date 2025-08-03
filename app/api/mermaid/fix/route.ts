import { generateObject } from 'ai';
import { mermaidFixRequestSchema, mermaidFixResponseSchema } from '../schema';
import { createAIModel } from '@/app/lib/ai-provider';
import {
  createMermaidFixSystemPrompt,
  createMermaidFixUserPrompt,
} from '@/app/lib/prompt-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate the request using the new schema
    const validation = mermaidFixRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        `Invalid request format: ${validation.error.message}`,
        {
          status: 400,
        }
      );
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
      model: createAIModel('fast'),
      schema: mermaidFixResponseSchema,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      maxRetries: 3, // Allow retries for temporary failures
    });

    // Validate that we actually received a chart in the response
    if (!fixedChart.chart || fixedChart.chart.trim() === '') {
      return new Response('Failed to generate a fixed chart', {
        status: 500,
      });
    }

    return Response.json(fixedChart);
  } catch (error) {
    console.error('Error in mermaid fix API:', error);
    return new Response('Internal server error during chart fixing', {
      status: 500,
    });
  }
}
