import { streamObject } from 'ai';
import { mermaidSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';

export const maxDuration = 30;

interface FixAttempt {
  chart: string;
  error: string;
  explanation?: string;
}

export async function POST(req: Request) {
  const {
    chart,
    error,
    chartType,
    description,
    previousAttempts = [],
  }: {
    chart: string;
    error: string;
    chartType: string;
    description?: string;
    previousAttempts?: FixAttempt[];
  } = await req.json();

  if (!chart || !error || !chartType) {
    return new Response('Missing required fields: chart, error, chartType', {
      status: 400,
    });
  }

  const previousAttemptsContext =
    previousAttempts.length > 0
      ? `\n\nPREVIOUS FIX ATTEMPTS:\n${previousAttempts
          .map(
            (attempt: FixAttempt, index: number) =>
              `Attempt ${index + 1}:\n` +
              `Chart: ${attempt.chart}\n` +
              `Error: ${attempt.error}\n` +
              `Explanation: ${attempt.explanation || 'No explanation provided'}\n`
          )
          .join(
            '\n---\n'
          )}\n\nDO NOT repeat these same approaches. Learn from these failures and try a different approach.`
      : '';

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
7. ALWAYS provide a clear explanation of what was wrong and how you fixed it

You must respond with a JSON object containing exactly four fields:
- "type": the chart type (must be "${chartType}")
- "description": the description of what the chart shows
- "chart": the corrected Mermaid diagram code
- "explanation": a clear explanation of what syntax errors were found and how you fixed them

Common Mermaid syntax issues to watch for:
- Missing or incorrect chart type declarations
- Invalid node IDs or names (must be alphanumeric, underscores, or hyphens)
- Incorrect arrow syntax
- Missing quotes around text with special characters or spaces
- Invalid subgraph syntax
- Incorrect indentation
- Missing semicolons where required
- Invalid class or style definitions
- Special characters in node IDs that need escaping
- Malformed mindmap node syntax
- Invalid sequence diagram participant names
- Incorrect Gantt chart date formats

Original broken chart:
\`\`\`
${chart}
\`\`\`

Error encountered:
${error}

Chart should be of type: ${chartType}
Chart description: ${description || 'Not provided'}
${previousAttemptsContext}

Analyze the error, understand what syntax rules were violated, and provide a corrected version with a detailed explanation of your fixes.
`;

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('reasoning', env.AI_PROVIDER),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please fix this broken Mermaid chart. The error was: ${error}${
          previousAttempts.length > 0
            ? `\n\nThis is attempt ${previousAttempts.length + 1}. Previous attempts have failed, so please try a different approach.`
            : ''
        }`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
