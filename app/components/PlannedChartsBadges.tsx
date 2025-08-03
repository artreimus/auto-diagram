'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { staggeredFadeInScale } from '@/app/lib/animations';
import { Plan } from '@/app/api/planner/schema';

interface PlannedChartsBadgesProps {
  plannedCharts: Plan[];
  isLoading?: boolean;
}

export const PlannedChartsBadges = ({
  plannedCharts,
  isLoading = false,
}: PlannedChartsBadgesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className='mb-12'
    >
      <h2 className='text-xl font-light tracking-tight text-monochrome-pure-white mb-6'>
        Planned Visualizations
      </h2>
      <div className='flex flex-wrap gap-3'>
        {plannedCharts.map((plan, index) => (
          <motion.div key={index} {...staggeredFadeInScale(index)}>
            <Badge
              variant='secondary'
              className='bg-monochrome-graphite border border-monochrome-pewter/30 text-monochrome-cloud hover:bg-monochrome-slate-dark/50 transition-colors duration-200 px-3 py-1.5 text-sm font-light tracking-wide'
            >
              {plan.type}
            </Badge>
          </motion.div>
        ))}
        {isLoading && <Skeleton className='h-8 w-28 bg-monochrome-pewter/50' />}
      </div>
    </motion.div>
  );
};
