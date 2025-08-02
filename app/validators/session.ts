import { z } from 'zod';
import { nanoid } from 'nanoid';
import { planSchema } from '@/app/api/planner/schema';
import { ChartSource } from '@/app/enum/session';

/**
 * Shared primitives
 */
const idSchema = z
  .string()
  .nanoid()
  .default(() => nanoid());
const isoDateTime = z.string().datetime({ offset: true });

/**
 * A single version (iteration) of a chart
 */
export const chartVersionSchema = z.object({
  chart: z.string(),
  rationale: z.string(),
  version: z.number().int().gte(1), // 1 = original, 2+ = fixes
  source: z.nativeEnum(ChartSource),
  error: z.string().optional(),
});

/**
 * Chart version data without the version number (for creating new versions)
 */
export const chartVersionDataSchema = chartVersionSchema.omit({
  version: true,
});

/**
 * Full chart history with multiple versions
 */
export const chartSchema = z
  .object({
    id: idSchema,
    versions: z.array(chartVersionSchema).default([]),
    currentVersion: z.number().default(0), // which version is active
    plan: planSchema,
  })
  .refine((c) => c.currentVersion < c.versions.length, {
    message: 'currentVersion must reference an existing version',
    path: ['currentVersion'],
  });

/**
 * A result corresponds to one user prompt and its charts
 */
export const resultSchema = z.object({
  id: idSchema, // unique per result within a session
  prompt: z.string(),
  charts: z.array(chartSchema).default([]),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

/**
 * A session groups many results together
 */
export const sessionSchema = z.object({
  id: idSchema,
  results: z.array(resultSchema).default([]),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

/**
 * Chart data for initial creation (without versions array populated)
 */
export const chartCreationSchema = z.object({
  id: idSchema,
  versions: z.array(chartVersionSchema).default([]),
  currentVersion: z.number().default(0),
  plan: planSchema,
});

/**
 * Inferred TypeScript helpers
 */
export type ChartVersion = z.infer<typeof chartVersionSchema>;
export type ChartVersionData = z.infer<typeof chartVersionDataSchema>;
export type Chart = z.infer<typeof chartSchema>;
export type ChartCreation = z.infer<typeof chartCreationSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Session = z.infer<typeof sessionSchema>;
