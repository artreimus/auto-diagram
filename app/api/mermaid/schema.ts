import { ChartType } from '@/app/enum/chart-types';
import { MessageRole } from '@/app/enum/session';
import { z } from 'zod';

export const mermaidSchema = z.object({
  type: z.nativeEnum(ChartType),
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
      role: z.nativeEnum(MessageRole),
      content: z.string(),
    })
  ),
  chartType: z.nativeEnum(ChartType),
  originalUserMessage: z
    .string()
    .describe('The original user query that started this session'),
  planDescription: z
    .string()
    .describe('The specific plan description for this chart'),
});

export type MermaidRequest = z.infer<typeof mermaidRequestSchema>;

// Schema for batch mermaid generation requests
export const batchMermaidRequestSchema = z.object({
  charts: z.array(
    z.object({
      chartType: z.nativeEnum(ChartType),
      description: z
        .string()
        .describe('The description of what the chart should show'),
      originalUserMessage: z
        .string()
        .describe('The original user query that started this session'),
      planDescription: z
        .string()
        .describe('The specific plan description for this chart'),
    })
  ),
});

export type BatchMermaidRequest = z.infer<typeof batchMermaidRequestSchema>;

// Schema for batch mermaid generation responses
export const batchMermaidResponseSchema = z.object({
  results: z.array(
    z.object({
      success: z.boolean(),
      chart: mermaidSchema.optional(),
      error: z.string().optional(),
      index: z.number(),
    })
  ),
});

export type BatchMermaidResponse = z.infer<typeof batchMermaidResponseSchema>;

// Schema for fix requests that include original context
export const mermaidFixRequestSchema = z.object({
  chart: z.string().describe('The broken Mermaid chart code'),
  error: z.string().describe('The error message from rendering'),
  chartType: z.nativeEnum(ChartType),
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
