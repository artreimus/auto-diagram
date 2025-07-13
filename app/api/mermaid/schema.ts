import { z } from 'zod';
import { supportedChartTypes } from '@/lib/chart-types';

export const mermaidSchema = z.object({
  type: z.enum(supportedChartTypes),
  description: z
    .string()
    .describe('An explanation of the generated Mermaid chart.'),
  chart: z.string().describe('The Mermaid code for the chart.'),
});

export type MermaidChart = z.infer<typeof mermaidSchema>;
