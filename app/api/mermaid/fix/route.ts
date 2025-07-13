import { streamObject } from 'ai';
import { mermaidSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { chart, error, chartType, description } = await req.json();

  if (!chart || !error || !chartType) {
    return new Response('Missing required fields: chart, error, chartType', {
      status: 400,
    });
  }

  const systemPrompt = `
You are an expert at debugging and fixing Mermaid diagram syntax errors.
You will be given a broken Mermaid chart, the error message, and the intended chart type and description.
Your job is to fix the syntax errors and return a corrected Mermaid chart.

IMPORTANT RULES:
1. Keep the overall structure and content as close to the original as possible
2. Only fix syntax errors, don't change the logic or content unless necessary
3. Ensure the chart type matches the specified type: "${chartType}"
4. The chart must be valid Mermaid syntax that will render without errors
5. Use proper escaping for special characters
6. Follow Mermaid best practices for the chart type

You must respond with a JSON object containing exactly three fields:
- "type": the chart type (must be "${chartType}")
- "description": the description of what the chart shows
- "chart": the corrected Mermaid diagram code

Common Mermaid syntax issues to watch for:
- Missing or incorrect chart type declarations
- Invalid node IDs or names
- Incorrect arrow syntax
- Missing quotes around text with special characters
- Invalid subgraph syntax
- Incorrect indentation
- Missing semicolons where required
- Invalid class or style definitions

Original broken chart:
\`\`\`
${chart}
\`\`\`

Error encountered:
${error}

Chart should be of type: ${chartType}
Chart description: ${description || 'Not provided'}

Please fix the syntax errors and return a working Mermaid chart.
`;

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('fast', env.AI_PROVIDER),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please fix this broken Mermaid chart. The error was: ${error}`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
