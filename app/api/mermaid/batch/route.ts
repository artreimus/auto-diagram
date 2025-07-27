import { generateObject } from 'ai';
import { ChartType } from '@/app/enum/chart-types';
import { mermaidSchema, batchMermaidRequestSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';
import { createMermaidGenerationPrompt } from '@/lib/prompt-utils';

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

  // Validate all chart types are supported
  for (const chart of charts) {
    if (!Object.values(ChartType).includes(chart.chartType as ChartType)) {
      return new Response(`Unsupported chart type: ${chart.chartType}`, {
        status: 400,
      });
    }
  }

  const results = await Promise.all(
    charts.map(async (chartRequest, index) => {
      try {
        const systemPrompt = await createMermaidGenerationPrompt(
          chartRequest.chartType,
          chartRequest.originalUserMessage,
          chartRequest.planDescription
        );

        const { object: chart } = await generateObject({
          model: createAIModel('fast', env.AI_PROVIDER),
          schema: mermaidSchema,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: chartRequest.description,
            },
          ],
        });

        return {
          success: true,
          chart,
          index,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          index,
        };
      }
    })
  );

  return Response.json({ results });
}
