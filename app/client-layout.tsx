'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { HistorySidebar } from './components/HistorySidebar';
import { Session } from '@/lib/session-schema';
import { useSessionManagement } from '@/hooks/use-session-management';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<Session[]>([]);
  const { getAllSessions } = useSessionManagement();

  // Get current session ID from pathname
  const currentSessionId = pathname.startsWith('/session/')
    ? pathname.split('/')[2]
    : null;

  // Load sessions from new format only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadSessions = async () => {
        try {
          const allSessions = await getAllSessions();
          setSessions(allSessions);
        } catch (error) {
          console.error('Failed to load sessions:', error);
        }
      };

      loadSessions();
    }
  }, [getAllSessions]);

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
        <HistorySidebar
          sessions={sessions}
          selectedSessionId={currentSessionId}
        />

        <SidebarInset className='flex-1'>
          {/* Sidebar trigger header - always visible */}
          <div className='flex items-center space-x-4 p-4 border-b border-monochrome-pewter/20'>
            <SidebarTrigger className='text-monochrome-pure-white' />
            {currentSessionId && (
              <div className='flex-1'>
                <p className='text-sm text-monochrome-silver'>
                  {(() => {
                    const session = sessions.find(
                      (s) => s.id === currentSessionId
                    );
                    if (session) {
                      const truncated =
                        session.results[0].prompt.length > 40
                          ? session.results[0].prompt.substring(0, 40) + '...'
                          : session.results[0].prompt;
                      return truncated;
                    }
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
