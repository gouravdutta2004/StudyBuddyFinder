import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, useTheme, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

export default function MiniCalendarWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/sessions/my');
        setSessions(res.data);
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchSessions();
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, height: '100%', display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5} color={isDark ? "white" : "#0f172a"}>
          <CalendarIcon size={20} color="#10b981" /> Agenda Matrix
        </Typography>
        <Box display="flex" alignItems="center" gap={1} bgcolor={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'} borderRadius="100px" p={0.5}>
          <IconButton onClick={prevMonth} size="small" sx={{ p: 0.5 }}><ChevronLeft size={16} /></IconButton>
          <Typography variant="caption" fontWeight={800} width={70} sx={{ textAlign: 'center', display: 'block' }}>{format(currentMonth, 'MMM yyyy')}</Typography>
          <IconButton onClick={nextMonth} size="small" sx={{ p: 0.5 }}><ChevronRight size={16} /></IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <Typography key={i} variant="caption" fontWeight={900} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} textAlign="center">{day}</Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, sm: 1 }, flex: 1 }}>
        <AnimatePresence mode="popLayout">
          {calendarDays.map((day) => {
            const dateEvents = sessions.filter(s => isSameDay(parseISO(s.scheduledAt), day));
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <Tooltip key={day.toString()} title={dateEvents.length > 0 ? `${dateEvents.length} session(s)` : ''} arrow placement="top">
                <Box 
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  sx={{ 
                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px', border: isToday ? '2px solid #10b981' : '1px solid transparent',
                    bgcolor: isToday ? 'transparent' : isCurrentMonth ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
                    color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    position: 'relative', cursor: dateEvents.length > 0 ? 'pointer' : 'default',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                  }}
                >
                  <Typography variant="caption" fontWeight={isToday ? 900 : 700}>{format(day, 'd')}</Typography>
                  
                  {/* Event Dots Under Date */}
                  {dateEvents.length > 0 && (
                    <Box sx={{ position: 'absolute', bottom: 4, display: 'flex', gap: 0.3 }}>
                      {dateEvents.slice(0, 3).map((e, idx) => (
                        <Box key={idx} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: e.isOnline ? '#6366f1' : '#10b981', boxShadow: `0 0 6px ${e.isOnline ? '#6366f1' : '#10b981'}` }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
