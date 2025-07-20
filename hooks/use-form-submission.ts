'use client';

import { useCallback } from 'react';

interface UseFormSubmissionProps {
  prompt: string;
  isProcessing: boolean;
  onSubmit: (sessionId: string) => void;
  createNewSession: () => string;
  submit: (data: { messages: { role: string; content: string }[] }) => void;
}

export function useFormSubmission({
  prompt,
  isProcessing,
  onSubmit,
  createNewSession,
  submit,
}: UseFormSubmissionProps) {
  const handleFormSubmission = useCallback(() => {
    if (!prompt.trim() || isProcessing) return;

    const sessionId = createNewSession();
    onSubmit(sessionId);
    submit({ messages: [{ role: 'user', content: prompt }] });
  }, [prompt, isProcessing, createNewSession, onSubmit, submit]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleFormSubmission();
    },
    [handleFormSubmission]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmission();
      }
      // Enter + Shift allows default behavior (new line)
    },
    [handleFormSubmission]
  );

  return {
    handleFormSubmit,
    handleKeyDown,
  };
}
