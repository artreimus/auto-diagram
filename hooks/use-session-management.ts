'use client';

import { useCallback, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  Session,
  sessionSchema,
  Chart,
  ChartVersion,
  ChartVersionData,
  Result,
} from '@/app/validators/session';
import { ChartSource } from '@/app/enum/session';

const SESSIONS_STORAGE_KEY = 'sessions';

// Helper functions for session storage
const getSessionsFromStorage = (): Session[] => {
  try {
    const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
};

const saveSessionsToStorage = (sessions: Session[]): void => {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
    throw new Error('Failed to save sessions');
  }
};

// Helper function for session finding
const findSessionById = (sessions: Session[], sessionId: string): Session => {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session;
};

interface SessionHookReturn {
  // Core session management
  createSession: () => Promise<string>;
  syncSession: (sessionId: string, updates: Partial<Session>) => Promise<void>;
  addResult: (
    sessionId: string,
    prompt: string,
    chartData: {
      chart: string;
      rationale: string;
      source: ChartSource;
      error?: string;
      plan: Chart['plan'];
    }
  ) => Promise<string>;
  addChartToResult: (
    sessionId: string,
    resultId: string,
    newChart: Chart
  ) => Promise<void>;
  addChartVersion: (
    sessionId: string,
    resultId: string,
    chartId: string,
    chartData: ChartVersionData
  ) => Promise<void>;

  // Loading and browsing
  loadSession: (sessionId: string) => Promise<Session | null>;
  getAllSessions: () => Promise<Session[]>;

  // State
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useSessionManagement(): SessionHookReturn {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create new session
  const createSession = useCallback(async (): Promise<string> => {
    setIsLoading(true);

    try {
      const sessionId = nanoid();
      const now = new Date().toISOString();

      const newSession: Session = {
        id: sessionId,
        results: [],
        createdAt: now,
        updatedAt: now,
      };

      // Validate before saving
      const validatedSession = sessionSchema.parse(newSession);

      // Get existing sessions and add new one
      const existingSessions = getSessionsFromStorage();
      const updatedSessions = [...existingSessions, validatedSession];

      // Save all sessions to single storage key
      saveSessionsToStorage(updatedSessions);

      setCurrentSessionId(sessionId);
      return sessionId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Advanced sync with phase tracking and validation
  const syncSession = useCallback(
    async (sessionId: string, updates: Partial<Session>): Promise<void> => {
      setIsLoading(true);

      try {
        // Get all sessions from consolidated storage
        const existingSessions = getSessionsFromStorage();
        const sessionIndex = existingSessions.findIndex(
          (s) => s.id === sessionId
        );

        if (sessionIndex === -1) {
          throw new Error('Session not found');
        }

        const currentSession = existingSessions[sessionIndex];
        const now = new Date().toISOString();

        const updatedSession: Session = {
          ...currentSession,
          ...updates,
          updatedAt: now,
        };

        // Validate before saving
        const validatedSession = sessionSchema.parse(updatedSession);

        // Update session in array and save all sessions
        const updatedSessions = [...existingSessions];
        updatedSessions[sessionIndex] = validatedSession;
        saveSessionsToStorage(updatedSessions);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to sync session';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Add a new result to session
  const addResult = useCallback(
    async (
      sessionId: string,
      prompt: string,
      chartData: {
        chart: string;
        rationale: string;
        source: ChartSource;
        error?: string;
        plan: Chart['plan'];
      }
    ): Promise<string> => {
      setIsLoading(true);

      try {
        // Get all sessions from consolidated storage
        const existingSessions = getSessionsFromStorage();
        const session = findSessionById(existingSessions, sessionId);

        const resultId = nanoid();
        const now = new Date().toISOString();

        const newVersion: ChartVersion = {
          version: 1,
          chart: chartData.chart,
          rationale: chartData.rationale,
          source: chartData.source,
          error: chartData.error,
        };

        const newChart: Chart = {
          id: nanoid(),
          versions: [newVersion],
          currentVersion: 0,
          plan: chartData.plan,
        };

        const newResult: Result = {
          id: resultId,
          prompt,
          charts: [newChart],
          createdAt: now,
          updatedAt: now,
        };

        // Update session with new result
        const updatedResults = [...session.results, newResult];

        await syncSession(sessionId, {
          results: updatedResults,
        });

        return resultId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add result';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [syncSession]
  );

  // Add chart to existing result
  const addChartToResult = useCallback(
    async (
      sessionId: string,
      resultId: string,
      newChart: Chart
    ): Promise<void> => {
      setIsLoading(true);

      try {
        // Get all sessions from consolidated storage
        const existingSessions = getSessionsFromStorage();
        const session = findSessionById(existingSessions, sessionId);

        const resultIndex = session.results.findIndex(
          (result) => result.id === resultId
        );

        if (resultIndex === -1) throw new Error('Result not found');

        const result = session.results[resultIndex];
        const now = new Date().toISOString();

        // Update result with new chart
        const updatedResult: Result = {
          ...result,
          charts: [...result.charts, newChart],
          updatedAt: now,
        };

        // Update session
        const updatedResults = [...session.results];
        updatedResults[resultIndex] = updatedResult;

        await syncSession(sessionId, {
          results: updatedResults,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add chart to result';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [syncSession]
  );

  const addChartVersion = useCallback(
    async (
      sessionId: string,
      resultId: string,
      chartId: string,
      chartData: ChartVersionData
    ): Promise<void> => {
      setIsLoading(true);

      try {
        // Get all sessions from consolidated storage
        const existingSessions = getSessionsFromStorage();
        const session = findSessionById(existingSessions, sessionId);

        const resultIndex = session.results.findIndex(
          (result) => result.id === resultId
        );
        if (resultIndex === -1) throw new Error('Result not found');

        const result = session.results[resultIndex];
        const chartIndex = result.charts.findIndex(
          (chart) => chart.id === chartId
        );
        if (chartIndex === -1) throw new Error('Chart not found');

        const chart = result.charts[chartIndex];
        const newVersionNumber =
          Math.max(...chart.versions.map((v) => v.version)) + 1;
        const now = new Date().toISOString();

        const newVersion: ChartVersion = {
          chart: chartData.chart,
          rationale: chartData.rationale,
          version: newVersionNumber,
          source: chartData.source,
          error: chartData.error,
        };

        // Update chart with new version
        const updatedChart: Chart = {
          ...chart,
          versions: [...chart.versions, newVersion],
          currentVersion: chart.versions.length,
        };

        // Update result
        const updatedCharts = [...result.charts];
        updatedCharts[chartIndex] = updatedChart;

        const updatedResult: Result = {
          ...result,
          charts: updatedCharts,
          updatedAt: now,
        };

        // Update session
        const updatedResults = [...session.results];
        updatedResults[resultIndex] = updatedResult;

        await syncSession(sessionId, {
          results: updatedResults,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add chart version';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [syncSession]
  );

  // Load session with validation
  const loadSession = useCallback(
    async (sessionId: string): Promise<Session | null> => {
      setIsLoading(true);

      try {
        // Get all sessions from consolidated storage
        const existingSessions = getSessionsFromStorage();
        const session = existingSessions.find((s) => s.id === sessionId);

        if (!session) return null;

        // Validate schema
        const validatedSession = sessionSchema.parse(session);
        return validatedSession;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load session';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get all sessions from consolidated storage
  const getAllSessions = useCallback(async (): Promise<Session[]> => {
    setIsLoading(true);

    try {
      // Get all sessions from consolidated storage
      const sessions = getSessionsFromStorage();

      // Validate each session
      const validatedSessions = sessions
        .map((session) => {
          try {
            return sessionSchema.parse(session);
          } catch (error) {
            console.error(`Failed to validate session ${session.id}:`, error);
            return null;
          }
        })
        .filter((session): session is Session => session !== null);

      // Sort by updatedAt (most recent first)
      validatedSessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return validatedSessions;
    } catch {
      setError('Failed to load sessions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createSession,
    syncSession,
    addResult,
    addChartToResult,
    addChartVersion,
    loadSession,
    getAllSessions,
    currentSessionId,
    isLoading,
    error,
  };
}
