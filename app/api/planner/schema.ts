import { z } from 'zod';
import { ChartType } from '@/app/enum/chart-types';

export const planSchema = z.object({
  type: z.nativeEnum(ChartType).describe('The type of chart to generate.'),
  description: z
    .string()
    .describe(
      'A detailed description of what the chart should visualize. This will be used as a prompt for another AI to generate the Mermaid code.'
    ),
});

export type Plan = z.infer<typeof planSchema>;

export const plansSchema = z.array(planSchema);
export type Plans = z.infer<typeof plansSchema>;
