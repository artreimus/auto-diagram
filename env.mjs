import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { AIProvider } from './app/enum/ai';

export const env = createEnv({
  server: {
    // AI Provider selection
    AI_PROVIDER: z
      .enum([AIProvider.GOOGLE, AIProvider.OPENROUTER])
      .default(AIProvider.GOOGLE),

    OPENROUTER_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

    // Model configuration
    GOOGLE_FAST_MODEL: z.string().default('gemini-2.5-flash'),
    GOOGLE_REASONING_MODEL: z.string().default('gemini-2.5-pro'),
    OPENROUTER_FAST_MODEL: z
      .string()
      .default('mistralai/devstral-small-2505:free'),
    OPENROUTER_REASONING_MODEL: z
      .string()
      .default('deepseek/deepseek-r1-0528:free'),
  },
  client: {
    // Nothing here
  },
  runtimeEnv: {
    // AI Provider selection
    AI_PROVIDER: process.env.AI_PROVIDER,

    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,

    // Model configuration
    GOOGLE_FAST_MODEL: process.env.GOOGLE_FAST_MODEL,
    GOOGLE_REASONING_MODEL: process.env.GOOGLE_REASONING_MODEL,
    OPENROUTER_FAST_MODEL: process.env.OPENROUTER_FAST_MODEL,
    OPENROUTER_REASONING_MODEL: process.env.OPENROUTER_REASONING_MODEL,
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
