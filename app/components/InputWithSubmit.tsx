'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MinimalLoadingSpinner } from './MinimalLoadingSpinner';
import { scaleIn } from '@/app/lib/animations';
import { ChartType } from '@/app/enum/chart-types';
import { useState, useEffect, useRef } from 'react';

interface InputWithSubmitProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isProcessing: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const CHART_COMMANDS = [
  {
    command: '/flowchart',
    type: ChartType.FLOWCHART,
    description: 'Create a flowchart diagram',
  },
  {
    command: '/sequence',
    type: ChartType.SEQUENCE,
    description: 'Create a sequence diagram',
  },
  {
    command: '/class',
    type: ChartType.CLASS,
    description: 'Create a class diagram',
  },
  {
    command: '/state',
    type: ChartType.STATE,
    description: 'Create a state diagram',
  },
  {
    command: '/gantt',
    type: ChartType.GANTT,
    description: 'Create a Gantt chart',
  },
  {
    command: '/journey',
    type: ChartType.JOURNEY,
    description: 'Create a user journey map',
  },
  {
    command: '/mindmap',
    type: ChartType.MINDMAP,
    description: 'Create a mind map',
  },
  {
    command: '/timeline',
    type: ChartType.TIMELINE,
    description: 'Create a timeline',
  },
  {
    command: '/gitgraph',
    type: ChartType.GITGRAPH,
    description: 'Create a Git graph',
  },
  {
    command: '/',
    type: undefined,
    description: 'Show all available chart types',
  },
];

export const InputWithSubmit = ({
  value,
  onChange,
  onSubmit,
  isProcessing,
  disabled = false,
  placeholder = 'Ask me anything…',
  autoFocus = false,
}: InputWithSubmitProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(CHART_COMMANDS);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize cursor position
  useEffect(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  }, []);

  useEffect(() => {
    // Get text up to cursor position
    const textToCursor = value.substring(0, cursorPosition);

    // Find the last "/" before the cursor
    const lastSlashIndex = textToCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      // Get the text from the last "/" to the cursor
      const commandPart = textToCursor.substring(lastSlashIndex);

      // Only show suggestions if:
      // 1. The command part starts with "/"
      // 2. There's no space after the "/" (incomplete command)
      // 3. The cursor is right after this command part or within it
      if (commandPart.startsWith('/') && !commandPart.includes(' ')) {
        const filtered = CHART_COMMANDS.filter((cmd) =>
          cmd.command.toLowerCase().startsWith(commandPart.toLowerCase())
        );
        setFilteredCommands(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPosition]);

  const handleSuggestionClick = (command: string) => {
    if (command === '/') {
      // Show all commands when clicking on the main "/" option
      return;
    }

    // Get text up to cursor position
    const textToCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the last "/" before the cursor
    const lastSlashIndex = textToCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      // Replace the incomplete command with the selected command
      const beforeSlash = textToCursor.substring(0, lastSlashIndex);
      const newValue = beforeSlash + command + ' ' + textAfterCursor;

      onChange(newValue);
      setShowSuggestions(false);

      // Set cursor position after the inserted command
      const newCursorPosition = beforeSlash.length + command.length + 1;

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
        setCursorPosition(newCursorPosition);
      }, 0);
    }
  };

  // Track cursor position changes
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  return (
    <form onSubmit={onSubmit} className='relative'>
      <div className='relative'>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleCursorChange}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSuggestions(false);
              return;
            }

            if (e.key === 'ArrowDown' && showSuggestions) {
              e.preventDefault();
              // Handle arrow navigation if needed
              return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
              if (showSuggestions && filteredCommands.length > 0) {
                e.preventDefault();
                const firstCommand = filteredCommands[0];
                if (firstCommand.command !== '/') {
                  handleSuggestionClick(firstCommand.command);
                }
                return;
              }

              e.preventDefault();
              if (value.trim()) {
                const form = e.currentTarget.closest('form');
                if (form) {
                  const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true,
                  });
                  form.dispatchEvent(submitEvent);
                }
              }
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 150);
          }}
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

      {/* Chart command suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className='absolute top-full left-0 right-0 mt-2 bg-monochrome-charcoal/95 backdrop-blur-lg border border-monochrome-pewter/20 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-monochrome-pewter/30'
          >
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.command}
                type='button'
                onClick={() => handleSuggestionClick(cmd.command)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-monochrome-pewter/10 transition-colors duration-200 ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === filteredCommands.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <span className='font-mono text-sm text-monochrome-pure-white bg-monochrome-pewter/20 px-2 py-1 rounded-md flex-shrink-0 mt-0.5'>
                  {cmd.command}
                </span>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-monochrome-pearl font-medium'>
                    {cmd.description}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
};
