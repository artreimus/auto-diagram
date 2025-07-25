'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import {
  HistoryChart,
  HistorySession,
  historySessionSchema,
} from '@/app/lib/history';

interface ChartResult {
  plan: any;
  mermaidResult?: any;
  fixResult?: any;
  finalChart?: string;
  error?: string;
  status?: string;
}

interface SessionData {
  prompt: string;
  status:
    | 'planning'
    | 'charts_generating'
    | 'charts_completed'
    | 'manual_fix_completed'
    | 'completed';
  timestamp: number;
  updatedAt?: number;
  completedAt?: number;

  // Data that gets populated progressively via onFinish callbacks
  plannedCharts?: any[] | null;
  batchMermaidResults?: any[] | null;
  chartResults?: ChartResult[];
  finalChartResults?: ChartResult[];

  // Metrics populated on completion
  aiSdkMetrics?: {
    plannerStreamDuration: number;
    batchGenerationTime: number;
    individualFixCount: number;
    totalApiCalls: number;
  };
}

export function useSessionManagement() {
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Create session immediately with initial data
  const createSession = useCallback(
    async (initialData: Partial<SessionData>): Promise<string> => {
      const sessionId = nanoid();
      const sessionData: SessionData = {
        prompt: '',
        status: 'planning',
        timestamp: Date.now(),
        ...initialData,
      };

      localStorage.setItem(`session-${sessionId}`, JSON.stringify(sessionData));

      // Also update recent sessions list
      const recentSessions = JSON.parse(
        localStorage.getItem('recent-sessions') || '[]'
      );
      recentSessions.unshift({
        id: sessionId,
        prompt: sessionData.prompt,
        timestamp: sessionData.timestamp,
        status: sessionData.status,
      });

      // Keep only last 10 sessions
      const limitedSessions = recentSessions.slice(0, 10);
      localStorage.setItem('recent-sessions', JSON.stringify(limitedSessions));

      setCurrentSessionId(sessionId);
      return sessionId;
    },
    []
  );

  // Sync session data - optimized for onFinish callbacks
  const syncSession = useCallback(
    (sessionId: string, updates: Partial<SessionData>) => {
      const existingData = localStorage.getItem(`session-${sessionId}`);
      if (!existingData) return;

      const currentData: SessionData = JSON.parse(existingData);
      const updatedData: SessionData = {
        ...currentData,
        ...updates,
        updatedAt: Date.now(),
      };

      localStorage.setItem(`session-${sessionId}`, JSON.stringify(updatedData));

      // Update recent sessions list with new status
      const recentSessions = JSON.parse(
        localStorage.getItem('recent-sessions') || '[]'
      );
      const updatedRecents = recentSessions.map(
        (session: { id: string; status: string; updatedAt?: number }) =>
          session.id === sessionId
            ? {
                ...session,
                status: updatedData.status,
                updatedAt: updatedData.updatedAt,
              }
            : session
      );
      localStorage.setItem('recent-sessions', JSON.stringify(updatedRecents));

      // If session is completed, also save to legacy chart-history format for compatibility
      if (updatedData.status === 'completed' && updatedData.finalChartResults) {
        const historyCharts: HistoryChart[] = updatedData.finalChartResults
          .filter((result) => result.finalChart)
          .map((result) => ({
            plan: result.plan,
            mermaid: {
              type: result.plan.type,
              description: result.plan.description,
              chart: result.finalChart!,
              explanation:
                result.fixResult?.explanation ||
                result.mermaidResult?.explanation,
            },
            fixAttempts: [], // Could be enhanced to include fix attempts
            finalError: result.error || null,
          }));

        if (historyCharts.length > 0) {
          const newSession: HistorySession = {
            id: sessionId,
            prompt: updatedData.prompt,
            createdAt: new Date(updatedData.timestamp).toISOString(),
            charts: historyCharts,
          };

          // Validate and save to legacy format
          const validation = historySessionSchema.safeParse(newSession);
          if (validation.success) {
            try {
              const saved = localStorage.getItem('chart-history');
              const history: HistorySession[] = saved ? JSON.parse(saved) : [];
              const newHistory = [...history, validation.data];
              localStorage.setItem('chart-history', JSON.stringify(newHistory));

              // Dispatch custom event to notify ClientLayout
              window.dispatchEvent(new CustomEvent('chart-history-updated'));

              // Navigate to session page
              router.push(`/session/${sessionId}`);
            } catch (error) {
              console.error('Failed to save to legacy format:', error);
            }
          }
        }
      }
    },
    [router]
  );

  // Load session data
  const loadSession = useCallback((sessionId: string): SessionData | null => {
    const data = localStorage.getItem(`session-${sessionId}`);
    return data ? JSON.parse(data) : null;
  }, []);

  // Get recent sessions
  const getRecentSessions = useCallback(() => {
    return JSON.parse(localStorage.getItem('recent-sessions') || '[]');
  }, []);

  // Legacy method for backward compatibility
  const createNewSession = useCallback(() => {
    const sessionId = nanoid();
    setCurrentSessionId(sessionId);
    return sessionId;
  }, []);

  return {
    currentSessionId,
    createSession,
    syncSession,
    loadSession,
    getRecentSessions,
    // Legacy compatibility
    createNewSession,
  };
}
