import { z } from 'zod';
import { supportedChartTypes } from '@/lib/chart-types';

export const chartPlanSchema = z.object({
  type: z.enum(supportedChartTypes).describe('The type of chart to generate.'),
  description: z
    .string()
    .describe(
      'A detailed description of what the chart should visualize. This will be used as a prompt for another AI to generate the Mermaid code.'
    ),
});

export type ChartPlan = z.infer<typeof chartPlanSchema>;

// For backend array streaming: schema for individual elements
export { chartPlanSchema as plannerElementSchema };

// For frontend: schema for the complete array
export const plannerSchema = z.array(chartPlanSchema);

export type PlannerResponse = ChartPlan[];
