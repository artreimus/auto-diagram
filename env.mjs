import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { AIProvider } from './app/enum/ai';

export const env = createEnv({
  server: {
    // AI Provider selection
    AI_PROVIDER: z.nativeEnum(AIProvider).default(AIProvider.GOOGLE),

    // API Keys (validated to ensure at least one is provided)
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),

    // Model configuration
    GOOGLE_FAST_MODEL: z.string().default('gemini-2.5-flash'),
    GOOGLE_REASONING_MODEL: z.string().default('gemini-2.5-pro'),
    OPENROUTER_FAST_MODEL: z
      .string()
      .default('mistralai/devstral-small-2505:free'),
    OPENROUTER_REASONING_MODEL: z
      .string()
      .default('deepseek/deepseek-r1-0528:free'),
    ANTHROPIC_FAST_MODEL: z.string().default('claude-sonnet-4-20250514'),
    ANTHROPIC_REASONING_MODEL: z.string().default('claude-opus-4-20250514'),
    OPENAI_FAST_MODEL: z.string().default('gpt-4o-mini'),
    OPENAI_REASONING_MODEL: z.string().default('o3'),
    EXA_API_KEY: z.string().optional(),
  },
  client: {
    // Nothing here
  },
  runtimeEnv: {
    // AI Provider selection
    AI_PROVIDER: process.env.AI_PROVIDER,

    // API Keys
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    // Model configuration
    GOOGLE_FAST_MODEL: process.env.GOOGLE_FAST_MODEL,
    GOOGLE_REASONING_MODEL: process.env.GOOGLE_REASONING_MODEL,
    OPENROUTER_FAST_MODEL: process.env.OPENROUTER_FAST_MODEL,
    OPENROUTER_REASONING_MODEL: process.env.OPENROUTER_REASONING_MODEL,
    ANTHROPIC_FAST_MODEL: process.env.ANTHROPIC_FAST_MODEL,
    ANTHROPIC_REASONING_MODEL: process.env.ANTHROPIC_REASONING_MODEL,
    OPENAI_FAST_MODEL: process.env.OPENAI_FAST_MODEL,
    OPENAI_REASONING_MODEL: process.env.OPENAI_REASONING_MODEL,
    EXA_API_KEY: process.env.EXA_API_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION=true` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()`.
   */
  emptyStringAsUndefined: true,
});
