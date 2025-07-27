import { z } from 'zod';
import { chartPlanSchema } from '@/app/api/planner/schema';
import { ChartSource, ResultStatus } from '@/app/enum/session';

export const chartsMetadata = z.object({
  version: z.number(), // 1 = original, 2+ = fixes
  chart: z.string(), // the mermaid code of the chart
  rationale: z.string(), // the rationale of the LLM that generated the chart
  createdAt: z.string().datetime(), // ISO timestamp string
  source: z.nativeEnum(ChartSource), // How this version was created
  error: z.string().optional(), // Error that prompted this version (for fixes)
  status: z.nativeEnum(ResultStatus).default(ResultStatus.PENDING),
});

// Chart version represents each iteration (original + fixes)
export const chartSchema = z.object({
  metadata: z.array(chartsMetadata).default([]),
  currentVersion: z.number().default(0), // Which version is currently active
  plan: chartPlanSchema,
});

// Chart data with full version history
export const resultSchema = z.object({
  id: z.string().nanoid(), // Unique chart ID within session
  prompt: z.string(), // the user prompt that generated the chart
  charts: z.array(chartSchema).default([]), // All versions (original + fixes)
  createdAt: z.string().datetime(), // ISO timestamp string
  updatedAt: z.string().datetime(), // ISO timestamp string
});

// Main session schema - core features only
export const sessionSchema = z.object({
  id: z.string().nanoid(),
  results: z.array(resultSchema).default([]), // all the results of the session
  createdAt: z.string().datetime(), // ISO timestamp string
  updatedAt: z.string().datetime(), // ISO timestamp string
});

export type Chart = z.infer<typeof chartSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Session = z.infer<typeof sessionSchema>;
