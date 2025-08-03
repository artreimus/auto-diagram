import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { env } from '@/env.mjs';
import { AIProvider } from '@/app/enum/ai';

/**
 * Creates an AI model instance based on the AI_PROVIDER environment variable.
 * Supports 'google', 'openrouter', 'anthropic', and 'openai' providers.
 * Model names are configurable via environment variables.
 */
export function createAIModel(modelType: 'fast' | 'reasoning') {
  const provider = env.AI_PROVIDER;

  switch (provider) {
    case AIProvider.GOOGLE: {
      const modelName =
        modelType === 'fast'
          ? env.GOOGLE_FAST_MODEL
          : env.GOOGLE_REASONING_MODEL;

      console.log(`Using Google model: ${modelName}`);
      return google(modelName);
    }

    case AIProvider.OPENROUTER: {
      console.log('Using OpenRouter provider');
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const modelName =
        modelType === 'fast'
          ? env.OPENROUTER_FAST_MODEL
          : env.OPENROUTER_REASONING_MODEL;

      console.log(`Using OpenRouter model: ${modelName}`);
      return openrouter(modelName);
    }

    case AIProvider.ANTHROPIC: {
      const modelName =
        modelType === 'fast'
          ? env.ANTHROPIC_FAST_MODEL
          : env.ANTHROPIC_REASONING_MODEL;

      console.log(`Using Anthropic model: ${modelName}`);
      return anthropic(modelName);
    }

    case AIProvider.OPENAI: {
      const modelName =
        modelType === 'fast'
          ? env.OPENAI_FAST_MODEL
          : env.OPENAI_REASONING_MODEL;

      console.log(`Using OpenAI model: ${modelName}`);
      return openai(modelName);
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
