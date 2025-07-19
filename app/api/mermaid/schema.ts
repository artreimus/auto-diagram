import { z } from 'zod';
import { supportedChartTypes } from '@/lib/chart-types';

export const mermaidSchema = z.object({
  type: z.enum(supportedChartTypes),
  description: z
    .string()
    .describe('An explanation of the generated Mermaid chart.'),
  chart: z.string().describe('The Mermaid code for the chart.'),
  explanation: z
    .string()
    .optional()
    .describe('Optional explanation of what was wrong and how it was fixed.'),
});

export type MermaidChart = z.infer<typeof mermaidSchema>;

// Schema for requests that include original context
export const mermaidRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  chartType: z.enum(supportedChartTypes),
  originalUserMessage: z
    .string()
    .describe('The original user query that started this session'),
  planDescription: z
    .string()
    .describe('The specific plan description for this chart'),
});

export type MermaidRequest = z.infer<typeof mermaidRequestSchema>;

// Schema for fix requests that include original context
export const mermaidFixRequestSchema = z.object({
  chart: z.string().describe('The broken Mermaid chart code'),
  error: z.string().describe('The error message from rendering'),
  chartType: z.enum(supportedChartTypes),
  description: z
    .string()
    .optional()
    .describe('Original description of what the chart should show'),
  originalUserMessage: z
    .string()
    .describe('The original user query that started this session'),
  planDescription: z
    .string()
    .describe('The specific plan description for this chart'),
  previousAttempts: z
    .array(
      z.object({
        chart: z.string(),
        error: z.string(),
        explanation: z.string().optional(),
      })
    )
    .default([]),
});

export type MermaidFixRequest = z.infer<typeof mermaidFixRequestSchema>;
