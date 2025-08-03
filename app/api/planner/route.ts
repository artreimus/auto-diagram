import { streamObject } from 'ai';
import { plansSchema } from './schema';
import { createAIModel } from '@/app/lib/ai-provider';
import {
  createPlannerSystemPrompt,
  createPlannerUserPrompt,
  enhancePromptWithWebSearch,
} from '@/app/lib/prompt-utils';
import { env } from 'process';
import Exa from 'exa-js';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  let enhancedPrompt = prompt;

  // Only perform web search if EXA_API_KEY is available and prompt exists
  if (env.EXA_API_KEY && prompt.trim()) {
    try {
      const exa = new Exa(env.EXA_API_KEY);

      const { results } = await exa.searchAndContents(prompt, {
        livecrawl: 'always',
        numResults: 3,
      });

      // Enhance the prompt with search results using the utility function
      enhancedPrompt = enhancePromptWithWebSearch(prompt, results || []);
    } catch (error) {
      console.error('Web search failed:', error);
      // Continue without search results if search fails
    }
  }

  // Create system and user prompts using prompt-utils
  const systemPrompt = createPlannerSystemPrompt();
  const userPrompt = createPlannerUserPrompt(enhancedPrompt);

  const result = streamObject({
    schema: plansSchema,
    model: createAIModel('reasoning'),
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return result.toTextStreamResponse();
}
