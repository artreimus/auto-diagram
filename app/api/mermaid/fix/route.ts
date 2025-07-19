import { streamObject } from 'ai';
import { mermaidSchema, mermaidFixRequestSchema } from '../schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';

export const maxDuration = 30;

interface FixAttempt {
  chart: string;
  error: string;
  explanation?: string;
}

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

  // Enhanced context section for better understanding
  const contextSection =
    originalUserMessage && planDescription
      ? `

ORIGINAL USER CONTEXT:
The user originally asked: "${originalUserMessage}"

SPECIFIC CHART PLAN:
This chart should fulfill: "${planDescription}"

CRITICAL: This is a SYNTAX FIX operation. DO NOT change the content, logic, or meaning of the chart. Only fix syntax errors to make it render properly while preserving the original intent.`
      : '';

  const systemPrompt = `You are an expert at debugging and fixing Mermaid diagram syntax errors.
You will be given a broken Mermaid chart, the error message, and the intended chart type and description.
Your job is to fix ONLY the syntax errors and return a corrected Mermaid chart.${contextSection}

CONTEXT GUIDANCE:
- The "ORIGINAL PLAN DESCRIPTION" shows what the user originally wanted this chart to accomplish  
- The "CURRENT CHART DESCRIPTION" shows what the mermaid generator thought it was creating
- Your job is to fix syntax ONLY while ensuring the chart fulfills BOTH the original plan and current description

CRITICAL RULES FOR SYNTAX FIXING:
1. PRESERVE ORIGINAL CONTENT: Keep the overall structure, logic, and content EXACTLY as intended
2. FIX SYNTAX ONLY: Only correct syntax errors, don't change the meaning or add/remove content
3. MAINTAIN CHART TYPE: Ensure the chart type matches the specified type: "${chartType}"
4. VALID MERMAID: The chart must be valid Mermaid syntax that will render without errors
5. NO CONTENT CHANGES: Do not alter node names, relationships, or flow logic unless they cause syntax errors
6. PRESERVE INTENT: The fixed chart should accomplish exactly the same visualization goal as the broken one

You must respond with a JSON object containing exactly four fields:
- "type": the chart type (must be "${chartType}")
- "description": the description of what the chart shows (keep original intent)
- "chart": the corrected Mermaid diagram code with ONLY syntax fixes
- "explanation": a clear explanation of ONLY the syntax errors you found and how you fixed them

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

ORIGINAL PLAN DESCRIPTION: 
${planDescription || 'Not provided'}

CURRENT CHART DESCRIPTION (from mermaid generation):
${description || 'Not provided'}

${previousAttemptsContext}

Remember: This is SYNTAX REPAIR ONLY. Fix the code to render properly while preserving ALL original content and intent.`;

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('reasoning', env.AI_PROVIDER),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please fix ONLY the syntax errors in this Mermaid chart. Do not change the content or meaning. The error was: ${error}${
          previousAttempts.length > 0
            ? `\n\nThis is attempt ${previousAttempts.length + 1}. Previous syntax fix attempts have failed, so please try a different technical approach to fix the syntax while keeping the content identical.`
            : ''
        }`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
