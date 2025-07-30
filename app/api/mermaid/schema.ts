import { ChartType } from '@/app/enum/chart-types';
import { z } from 'zod';

export const mermaidSchema = z.object({
  type: z.nativeEnum(ChartType),
  description: z
    .string()
    .describe('An explanation of the generated Mermaid chart.'),
  chart: z.string().describe('The Mermaid code for the chart.'),
});

export type MermaidChart = z.infer<typeof mermaidSchema>;

export const mermaidRequestSchema = z.object({
  chartType: z.nativeEnum(ChartType),
  originalUserMessage: z
    .string()
    .describe('The original user query that started this session'),
  planDescription: z
    .string()
    .describe('The specific plan description for this chart'),
});

export type MermaidRequest = z.infer<typeof mermaidRequestSchema>;

export const mermaidResponseSchema = z.object({
  chart: mermaidSchema,
  id: z.string().nanoid(),
});

export type MermaidResponse = z.infer<typeof mermaidResponseSchema>;

export const batchMermaidRequestSchema = z.object({
  charts: z.array(mermaidRequestSchema),
});

export type BatchMermaidRequest = z.infer<typeof batchMermaidRequestSchema>;

export const batchMermaidResponseSchema = z.object({
  results: z.array(mermaidResponseSchema),
});

export type BatchMermaidResponse = z.infer<typeof batchMermaidResponseSchema>;

export const mermaidFixRequestSchema = z.object({
  chartType: z.nativeEnum(ChartType),
  chart: z.string().describe('The broken Mermaid chart code'),
  error: z.string().describe('The error message from rendering'),
  planDescription: z
    .string()
    .describe('The specific plan description for this chart'),
});

export type MermaidFixRequest = z.infer<typeof mermaidFixRequestSchema>;
