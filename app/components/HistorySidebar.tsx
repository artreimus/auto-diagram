'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Calendar, ChartBar } from 'lucide-react';
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
import { HistorySession } from '@/app/lib/history';

interface HistorySidebarProps {
  sessions: HistorySession[];
  selectedSessionId: string | null;
  onSessionSelect: (session: HistorySession) => void;
  onNewSession: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

const truncatePrompt = (prompt: string, maxLength: number = 60) => {
  return prompt.length > maxLength
    ? prompt.substring(0, maxLength) + '...'
    : prompt;
};

export function HistorySidebar({
  sessions,
  selectedSessionId,
  onSessionSelect,
  onNewSession,
}: HistorySidebarProps) {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Sidebar side='left' variant='sidebar'>
      <SidebarHeader className='border-b border-monochrome-pewter/20'>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between p-2'
        >
          <div className='flex items-center space-x-2'>
            <ChartBar className='w-5 h-5 text-monochrome-pure-white' />
            <h2 className='text-lg font-light text-monochrome-pure-white tracking-tight'>
              Auto Diagram
            </h2>
          </div>
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

      <SidebarContent className='bg-monochrome-charcoal/20'>
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
                        tooltip={session.prompt}
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <p className='text-sm font-medium text-monochrome-pure-white truncate'>
                              {truncatePrompt(session.prompt, 40)}
                            </p>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs text-monochrome-silver font-light flex items-center space-x-1'>
                              <Calendar className='w-3 h-3' />
                              <span>{formatDate(session.createdAt)}</span>
                            </span>
                            <span className='text-xs text-monochrome-ash bg-monochrome-graphite/30 px-2 py-0.5 rounded-full'>
                              {session.charts.length} chart
                              {session.charts.length !== 1 ? 's' : ''}
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
