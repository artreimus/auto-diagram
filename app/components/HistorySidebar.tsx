'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Calendar } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Session } from '@/lib/session-schema';
import { AutoDiagramLogo } from './AutoDiagramLogo';
import { useRouter } from 'next/navigation';

interface HistorySidebarProps {
  sessions: Session[];
  selectedSessionId: string | null;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  // For dates within the last week, show relative time
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date > weekAgo) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // For older dates, show formatted date
  return format(date, 'MMM d, yyyy');
};

export function HistorySidebar({
  sessions,
  selectedSessionId,
}: HistorySidebarProps) {
  const router = useRouter();

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const onSessionSelect = (session: Session) => {
    router.push(`/session/${session.id}`);
  };

  const onNewSession = () => {
    router.push('/');
  };

  return (
    <Sidebar 
      side='left' 
      variant='sidebar' 
      className='bg-monochrome-charcoal border-r border-monochrome-pewter/20 [&_[data-mobile="true"]]:!bg-monochrome-charcoal'
    >
      <SidebarHeader className='border-b border-monochrome-pewter/20'>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between p-2'
        >
          <button
            onClick={onNewSession}
            className='flex items-center space-x-2 hover:bg-monochrome-pure-white/5 rounded-lg px-2 py-1 transition-colors duration-200'
          >
            <AutoDiagramLogo className='w-5 h-5 text-monochrome-pure-white' />
            <h2 className='text-lg font-light text-monochrome-pure-white tracking-tight'>
              Auto Diagram
            </h2>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className='p-2'
        >
          <SidebarMenuButton
            onClick={onNewSession}
            className='w-full justify-center bg-monochrome-pure-white/5 hover:bg-monochrome-pure-white/10 text-monochrome-pure-white border border-monochrome-pewter/20'
          >
            <FileText className='w-4 h-4' />
            New Session
          </SidebarMenuButton>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className='bg-monochrome-charcoal'>
        <SidebarGroup>
          <SidebarGroupLabel className='flex items-center space-x-2 text-monochrome-silver'>
            <Clock className='w-4 h-4' />
            <span>Recent Sessions</span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {sortedSessions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='p-4 text-center'
                >
                  <p className='text-sm text-monochrome-silver font-light'>
                    No sessions yet. Create your first visualization!
                  </p>
                </motion.div>
              ) : (
                sortedSessions.map((session, index) => (
                  <SidebarMenuItem key={session.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SidebarMenuButton
                        isActive={selectedSessionId === session.id}
                        onClick={() => onSessionSelect(session)}
                        className='w-full justify-start text-left p-3 h-auto'
                        tooltip={
                          session.results.length > 0
                            ? session.results[0].prompt
                            : `Session ${session.id.slice(0, 8)}`
                        }
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <p className='text-sm font-medium text-monochrome-pure-white truncate'>
                              {session.results.length > 0
                                ? session.results[0].prompt.length > 30
                                  ? session.results[0].prompt.substring(0, 30) +
                                    '...'
                                  : session.results[0].prompt
                                : `Session ${session.id.slice(0, 8)}`}
                            </p>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-monochrome-silver font-light flex items-center space-x-1'>
                              <Calendar className='w-3 h-3' />
                              <span>
                                {formatDate(
                                  new Date(session.updatedAt).getTime()
                                )}
                              </span>
                            </span>
                            <span className='text-xs text-monochrome-ash bg-monochrome-graphite/30 px-2 py-0.5 rounded-full'>
                              {(() => {
                                // Count total charts across all results
                                const totalCharts = session.results.reduce(
                                  (sum, result) => sum + result.charts.length,
                                  0
                                );

                                return `${totalCharts} chart${totalCharts !== 1 ? 's' : ''}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
