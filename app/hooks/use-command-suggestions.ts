'use client';

import { useState, useEffect, useRef } from 'react';
import { ChartType } from '@/app/enum/chart-types';

interface ChartCommand {
  command: string;
  type: ChartType | undefined;
  description: string;
}

const CHART_COMMANDS: ChartCommand[] = [
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

interface UseCommandSuggestionsOptions {
  value: string;
  cursorPosition: number;
  onChange: (value: string) => void;
  onSuggestionApplied?: () => void;
}

interface UseCommandSuggestionsReturn {
  showSuggestions: boolean;
  filteredCommands: ChartCommand[];
  handleSuggestionClick: (command: string) => void;
  hideSuggestions: () => void;
  applyFirstSuggestion: () => boolean;
}

export function useCommandSuggestions({
  value,
  cursorPosition,
  onChange,
  onSuggestionApplied,
}: UseCommandSuggestionsOptions): UseCommandSuggestionsReturn {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] =
    useState<ChartCommand[]>(CHART_COMMANDS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onSuggestionApplied?.();

      // Set cursor position after the inserted command
      const newCursorPosition = beforeSlash.length + command.length + 1;

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            newCursorPosition,
            newCursorPosition
          );
        }
      }, 0);
    }
  };

  const hideSuggestions = () => {
    setShowSuggestions(false);
  };

  const applyFirstSuggestion = (): boolean => {
    if (showSuggestions && filteredCommands.length > 0) {
      const firstCommand = filteredCommands[0];
      if (firstCommand.command !== '/') {
        handleSuggestionClick(firstCommand.command);
        return true;
      }
    }
    return false;
  };

  return {
    showSuggestions,
    filteredCommands,
    handleSuggestionClick,
    hideSuggestions,
    applyFirstSuggestion,
  };
}

// Export the commands array for reuse
export { CHART_COMMANDS };
export type { ChartCommand };
