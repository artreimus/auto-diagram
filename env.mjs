import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    OPENROUTER_API_KEY: z.string().min(1),
  },
  client: {
    // Nothing here
  },
  runtimeEnv: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
  /**
   * Run \`build\` or \`dev\` with \`SKIP_ENV_VALIDATION=true\` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * \`SOME_VAR: z.string()\`.
   */
  emptyStringAsUndefined: true,
});
