import { promises as fs } from 'fs';
import { join } from 'path';
import { supportedChartTypes } from './chart-types';

/**
 * Template variables that can be replaced in prompts
 */
export interface PromptVariables {
  [key: string]: string | number | boolean | string[] | readonly string[];
}

/**
 * Cache for loaded prompt templates
 */
const promptCache = new Map<string, string>();

/**
 * Loads a prompt template from the prompts directory
 */
async function loadPromptTemplate(templateName: string): Promise<string> {
  if (promptCache.has(templateName)) {
    return promptCache.get(templateName)!;
  }

  try {
    const promptPath = join(process.cwd(), 'prompts', `${templateName}.md`);
    const template = await fs.readFile(promptPath, 'utf-8');
    promptCache.set(templateName, template);
    return template;
  } catch (error) {
    console.error(`Failed to load prompt template ${templateName}:`, error);
    throw new Error(`Failed to load prompt template: ${templateName}`);
  }
}

/**
 * Renders a template by replacing variables with actual values
 */
function renderTemplate(template: string, variables: PromptVariables): string {
  let rendered = template;

  // Replace template variables in the format {{variableName}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    let replacement: string;

    if (Array.isArray(value)) {
      replacement = value.join(', ');
    } else {
      replacement = String(value);
    }

    rendered = rendered.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      replacement
    );
  }

  return rendered;
}

/**
 * Creates the mermaid generation system prompt
 */
export async function createMermaidGenerationPrompt(
  chartType: string,
  originalUserMessage?: string,
  planDescription?: string
): Promise<string> {
  const template = await loadPromptTemplate('mermaid-generation');

  // Build context section
  const contextSection =
    originalUserMessage && planDescription
      ? `

ORIGINAL USER CONTEXT:
The user originally asked: "${originalUserMessage}"

SPECIFIC CHART PLAN:
This chart should fulfill: "${planDescription}"

IMPORTANT: Your chart must directly address the original user's question while specifically implementing the chart plan described above. Stay true to the original user's intent and the planned chart scope.`
      : '';

  return renderTemplate(template, {
    chartType,
    contextSection,
  });
}

/**
 * Creates the mermaid fix system prompt
 */
export async function createMermaidFixPrompt(
  chartType: string,
  chart: string,
  error: string,
  originalUserMessage?: string,
  planDescription?: string,
  description?: string,
  previousAttempts: Array<{
    chart: string;
    error: string;
    explanation?: string;
  }> = []
): Promise<string> {
  const template = await loadPromptTemplate('mermaid-fix');

  // Build context section
  const contextSection =
    originalUserMessage && planDescription
      ? `

ORIGINAL USER CONTEXT:
The user originally asked: "${originalUserMessage}"

SPECIFIC CHART PLAN:
This chart should fulfill: "${planDescription}"

CRITICAL: This is a SYNTAX FIX operation. DO NOT change the content, logic, or meaning of the chart. Only fix syntax errors to make it render properly while preserving the original intent.`
      : '';

  // Build previous attempts context
  const previousAttemptsContext =
    previousAttempts.length > 0
      ? `\n\nPREVIOUS FIX ATTEMPTS:\n${previousAttempts
          .map(
            (attempt, index) =>
              `Attempt ${index + 1}:\n` +
              `Chart: ${attempt.chart}\n` +
              `Error: ${attempt.error}\n` +
              `Explanation: ${attempt.explanation || 'No explanation provided'}\n`
          )
          .join(
            '\n---\n'
          )}\n\nDO NOT repeat these same approaches. Learn from these failures and try a different approach.`
      : '';

  return renderTemplate(template, {
    chartType,
    contextSection,
    chart,
    error,
    planDescription: planDescription || 'Not provided',
    description: description || 'Not provided',
    previousAttemptsContext,
  });
}

/**
 * Creates the planner system prompt
 */
export async function createPlannerPrompt(): Promise<string> {
  const template = await loadPromptTemplate('planner');

  return renderTemplate(template, {
    supportedChartTypes: supportedChartTypes,
  });
}

/**
 * Clears the prompt cache (useful for development/testing)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}
