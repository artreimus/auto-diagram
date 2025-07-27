import { z } from 'zod';
import { chartPlanSchema } from '@/app/api/planner/schema';
import { ChartSource, ResultStatus } from '@/app/enum/session';

// Chart version represents each iteration (original + fixes)
export const chartSchema = z.object({
  version: z.number(), // 1 = original, 2+ = fixes
  chart: z.string(), // the mermaid code of the chart
  ratio: z.string(), // the rationale of the LLM that generated the chart
  createdAt: z.date(), // timestamp
  source: z.nativeEnum(ChartSource), // How this version was created
  error: z.string().optional(), // Error that prompted this version (for fixes)
  plan: chartPlanSchema,
});

// Chart data with full version history
export const resultSchema = z.object({
  id: z.string().nanoid(), // Unique chart ID within session
  prompt: z.string(), // the user prompt that generated the chart
  charts: z.array(chartSchema).default([]), // All versions (original + fixes)
  currentVersion: z.number().default(0), // Which version is currently active
  status: z.nativeEnum(ResultStatus).default(ResultStatus.PENDING),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Main session schema - core features only
export const sessionSchema = z.object({
  id: z.string().nanoid(),
  results: z.array(resultSchema).default([]), // all the results of the session
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Chart = z.infer<typeof chartSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Session = z.infer<typeof sessionSchema>;
