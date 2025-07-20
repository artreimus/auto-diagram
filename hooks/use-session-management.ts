'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import {
  HistoryChart,
  HistorySession,
  historySessionSchema,
} from '@/app/lib/history';

export function useSessionManagement() {
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [completedCharts, setCompletedCharts] = useState<
    Map<number, HistoryChart>
  >(new Map());

  const createNewSession = useCallback(() => {
    const sessionId = nanoid();
    setCurrentSessionId(sessionId);
    setCompletedCharts(new Map());
    setHasSaved(false);
    return sessionId;
  }, []);

  const handleChartComplete = useCallback(
    (id: number, chartData: HistoryChart) => {
      setCompletedCharts((prev) => new Map(prev).set(id, chartData));
    },
    []
  );

  const resetSession = useCallback(() => {
    setCurrentSessionId(null);
    setCompletedCharts(new Map());
    setHasSaved(false);
  }, []);

  // Handle session completion and navigation
  const handleSessionCompletion = useCallback(
    (plannedCharts: any[], prompt: string) => {
      if (
        !plannedCharts ||
        !Array.isArray(plannedCharts) ||
        plannedCharts.length === 0 ||
        hasSaved ||
        !currentSessionId
      ) {
        return;
      }

      const allChartsCompleted =
        completedCharts.size === plannedCharts.length &&
        completedCharts.size > 0;

      if (allChartsCompleted) {
        const newSession: HistorySession = {
          id: currentSessionId,
          prompt: prompt,
          createdAt: new Date().toISOString(),
          charts: Array.from(completedCharts.values()),
        };

        // Validate the new session before saving and navigating
        const validation = historySessionSchema.safeParse(newSession);

        if (validation.success) {
          // Save to localStorage
          try {
            const saved = localStorage.getItem('chart-history');
            const history: HistorySession[] = saved ? JSON.parse(saved) : [];
            const newHistory = [...history, validation.data];
            localStorage.setItem('chart-history', JSON.stringify(newHistory));
            setHasSaved(true);

            // Dispatch custom event to notify ClientLayout to refresh history
            window.dispatchEvent(new CustomEvent('chart-history-updated'));

            // Navigate to the new session page
            router.push(`/session/${currentSessionId}`);
          } catch (error) {
            console.error('Failed to save session:', error);
          }
        } else {
          console.error('Failed to validate new session:', validation.error);
        }
      }
    },
    [completedCharts, hasSaved, currentSessionId, router]
  );

  return {
    currentSessionId,
    hasSaved,
    completedCharts,
    createNewSession,
    handleChartComplete,
    resetSession,
    handleSessionCompletion,
  };
}
