import { z } from 'zod';
import { chartPlanSchema } from '@/app/api/planner/schema';
import { mermaidSchema } from '@/app/api/mermaid/schema';

export const fixAttemptSchema = z.object({
  chart: z.string(),
  error: z.string(),
  explanation: z.string().optional(),
});

export const historyChartSchema = z.object({
  plan: chartPlanSchema,
  mermaid: mermaidSchema.optional(), // Mermaid chart might not be generated if an error occurs
  fixAttempts: z.array(fixAttemptSchema),
  finalError: z.string().nullable(),
});

export const historySessionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  createdAt: z.string().datetime(),
  charts: z.array(historyChartSchema),
});

export const historySchema = z.array(historySessionSchema);

export type FixAttempt = z.infer<typeof fixAttemptSchema>;
export type HistoryChart = z.infer<typeof historyChartSchema>;
export type HistorySession = z.infer<typeof historySessionSchema>;
