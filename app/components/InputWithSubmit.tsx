'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MinimalLoadingSpinner } from './MinimalLoadingSpinner';
import { scaleIn } from '@/app/lib/animations';

interface InputWithSubmitProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const InputWithSubmit = ({
  value,
  onChange,
  onSubmit,
  isProcessing,
  disabled = false,
  placeholder = 'Ask me anything…',
  autoFocus = false,
}: InputWithSubmitProps) => (
  <form onSubmit={onSubmit} className='relative'>
    <div className='relative'>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full text-base font-medium tracking-tight text-monochrome-pure-white placeholder:text-monochrome-ash bg-transparent border border-monochrome-pewter/30 focus:border-monochrome-pure-white/60 hover:border-monochrome-pearl/40 rounded-2xl px-6 py-4 pr-12 transition-all duration-300 ease-out focus:outline-none focus:ring-0 shadow-micro backdrop-blur-sm min-h-[3.5rem] max-h-48 resize-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-monochrome-pewter/30 hover:scrollbar-thumb-monochrome-pewter/50'
        disabled={disabled || isProcessing}
        autoFocus={autoFocus}
      />

      {/* Hairline inner glow on focus */}
      <div className='absolute inset-0 rounded-2xl pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300'>
        <div className='absolute inset-0 rounded-2xl shadow-hairline' />
      </div>
    </div>

    {/* Submit affordance - only show when there's content */}
    <AnimatePresence>
      {value.trim() && !isProcessing && (
        <motion.div
          {...scaleIn}
          className='absolute right-2 top-1/2 -translate-y-1/2 z-10'
        >
          <Button
            type='submit'
            className='rounded-xl px-3 py-2 text-lg font-medium text-monochrome-pure-white bg-transparent hover:bg-monochrome-pure-white/10 transition-all duration-200 leading-none'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='rotate-45'
            >
              <path
                d='M5 12h14M12 5l7 7-7 7'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Elegant loading state */}
    {isProcessing && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='absolute right-6 top-1/2 -translate-y-1/2 z-10'
      >
        <MinimalLoadingSpinner />
      </motion.div>
    )}
  </form>
);
