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
