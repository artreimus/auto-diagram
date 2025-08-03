'use client';

import { usePathname } from 'next/navigation';

import { HistorySidebar } from './components/HistorySidebar';
import { useSessionManagement } from '@/app/hooks/use-session-management';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { allSessions } = useSessionManagement();

  // Get current session ID from pathname
  const currentSessionId = pathname.startsWith('/session/')
    ? pathname.split('/')[2]
    : null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full bg-monochrome-pure-black text-monochrome-pure-white antialiased'>
        <HistorySidebar
          sessions={allSessions}
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
                    const session = allSessions.find(
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
      <Toaster />
    </SidebarProvider>
  );
}
