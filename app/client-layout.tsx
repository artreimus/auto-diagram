'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { HistorySidebar } from './components/HistorySidebar';
import { HistorySession } from './lib/history';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Get current session ID from pathname
  const currentSessionId = pathname.startsWith('/session/')
    ? pathname.split('/')[2]
    : null;

  // Load history from localStorage only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chart-history');
        if (saved) {
          const parsed = JSON.parse(saved);
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load chart history:', error);
      }
      setIsClient(true);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem('chart-history', JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save chart history:', error);
      }
    }
  }, [history, isClient]);

  // Listen for storage changes from other tabs/windows AND custom events
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chart-history' && e.newValue) {
        try {
          const newHistory = JSON.parse(e.newValue);
          setHistory(newHistory);
        } catch (error) {
          console.error('Failed to sync history from storage:', error);
        }
      }
    };

    // Custom event for same-tab localStorage updates
    const handleCustomHistoryUpdate = () => {
      try {
        const saved = localStorage.getItem('chart-history');
        if (saved) {
          const newHistory = JSON.parse(saved);
          setHistory(newHistory);
        }
      } catch (error) {
        console.error('Failed to refresh history:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('chart-history-updated', handleCustomHistoryUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'chart-history-updated',
        handleCustomHistoryUpdate
      );
    };
  }, [isClient]);

  const handleSessionSelect = (session: HistorySession) => {
    router.push(`/session/${session.id}`);
  };

  const handleNewSession = () => {
    router.push('/');
  };

  if (!isClient) {
    return (
      <div className='min-h-screen bg-monochrome-pure-black text-monochrome-pure-white antialiased flex items-center justify-center'>
        <div className='flex items-center space-x-1'>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className='w-0.5 h-0.5 bg-monochrome-pure-white rounded-full animate-pulse'
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
        <HistorySidebar
          sessions={history}
          selectedSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />

        <SidebarInset className='flex-1'>
          {/* Sidebar trigger header - always visible */}
          <div className='flex items-center space-x-4 p-4 border-b border-monochrome-pewter/20'>
            <SidebarTrigger className='text-monochrome-pure-white' />
            {currentSessionId && (
              <div className='flex-1'>
                <p className='text-sm text-monochrome-silver'>
                  {(() => {
                    const session = history.find(
                      (s) => s.id === currentSessionId
                    );
                    if (session) {
                      const truncated =
                        session.prompt.length > 40
                          ? session.prompt.substring(0, 40) + '...'
                          : session.prompt;
                      return truncated;
                    }
                    return `Session: ${currentSessionId.slice(0, 8)}...`;
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className='relative flex-1'>{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
