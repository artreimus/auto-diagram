import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '@/env.mjs';
import { AIProvider } from '@/app/enum/ai';

/**
/**
 * Creates an AI model instance based on the AI_PROVIDER environment variable.
 * Supports 'google' for Google Gemini models and 'openrouter' for OpenRouter models.
 * Model names are configurable via environment variables.
 */
export function createAIModel(
  modelType: 'fast' | 'reasoning',
  provider: AIProvider
) {
  // Use the AI_PROVIDER environment variable to determine which provider to use
  if (provider === AIProvider.GOOGLE) {
    // Return appropriate Google model from environment variables
    const modelName =
      modelType === 'fast' ? env.GOOGLE_FAST_MODEL : env.GOOGLE_REASONING_MODEL;

    console.log(`Using Google model: ${modelName}`);
    return google(modelName);
  }

  // Use OpenRouter provider
  console.log('Using OpenRouter provider');
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
  });

  // Return appropriate OpenRouter model from environment variables
  const modelName =
    modelType === 'fast'
      ? env.OPENROUTER_FAST_MODEL
      : env.OPENROUTER_REASONING_MODEL;

  console.log(`Using OpenRouter model: ${modelName}`);
  return openrouter(modelName);
}
