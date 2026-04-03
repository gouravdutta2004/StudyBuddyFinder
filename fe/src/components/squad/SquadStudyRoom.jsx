import React from 'react';
import { Box, Typography, useTheme, Chip } from '@mui/material';
import {
  Lock, Pin, Calendar, BarChart2, Mic2, CheckSquare,
  Users, Clock, Video, Shield, TrendingUp, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

/* Plus Jakarta Sans is loaded via Google Fonts in index.html or index.css */
const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif";

const FEATURES = [
  {
    icon: Lock,
    title: 'Private Rooms',
    desc: 'Create invite-only study rooms with password protection. Full control over who enters your learning space.',
    color: '#6366f1',
    badge: 'Privacy',
  },
  {
    icon: Pin,
    title: 'Pinned Resources',
    desc: 'Pin links, notes, PDFs, and flashcard decks to the top of any room so key materials are always visible.',
    color: '#f59e0b',
    badge: 'Organization',
  },
  {
    icon: Calendar,
    title: 'Scheduled Sessions',
    desc: 'Plan study sessions in advance. Members get notified automatically 15 minutes before the session starts.',
    color: '#22d3ee',
    badge: 'Planning',
  },
  {
    icon: BarChart2,
    title: 'Squad Analytics',
    desc: 'Track collective study hours, session frequency, and member contribution to keep the squad accountable.',
    color: '#10b981',
    badge: 'Insights',
  },
  {
    icon: Mic2,
    title: 'Voice Channels',
    desc: 'Persistent voice channels for the squad. Drop in and drop out without scheduling — always available.',
    color: '#a78bfa',
    badge: 'Communication',
  },
  {
    icon: CheckSquare,
    title: 'Polls & Decisions',
    desc: 'Create quick polls to decide on topics, schedules, or study materials. Democratic squad management.',
    color: '#fb7185',
    badge: 'Collaboration',
  },
];

export default function SquadStudyRoom({ groupId, name }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const roomName = `StudyFriend_Squad_${groupId}`;

  const bg = isDark ? '#0a0f1c' : '#f8fafc';
  const cardBg = isDark ? '#0d1117' : '#ffffff';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <Box sx={{ fontFamily: FONT, height: '100%', overflowY: 'auto', bgcolor: bg }}>

      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: 3, borderBottom: '1px solid', borderColor: borderC, bgcolor: cardBg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', flexShrink: 0 }}>
            <Users size={22} color="white" />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.2rem', color: isDark ? 'white' : '#0f172a', lineHeight: 1.2 }}>
              {name || 'Squad Room'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontFamily: FONT, fontWeight: 500 }}>
                Squad Room · Collaborative Space
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>

        {/* Video Room */}
        <Box sx={{
          borderRadius: '20px', overflow: 'hidden', mb: 5,
          border: '1px solid', borderColor: borderC,
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <Box sx={{ bgcolor: isDark ? '#0d1117' : '#f1f5f9', px: 3, py: 2, borderBottom: '1px solid', borderColor: borderC, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Video size={16} color="#6366f1" />
            <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>
              Live Video Room
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e' }} />
              <Typography sx={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700, fontFamily: FONT }}>Live</Typography>
            </Box>
          </Box>
          <Box sx={{ minHeight: 460 }}>
            <iframe
              src={`https://meet.jit.si/${roomName}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: '100%', height: '460px', border: 0 }}
              title={`Squad Room - ${name}`}
            />
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.7rem', color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', mb: 0.75 }}>
              Squad Features
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.5rem', color: isDark ? 'white' : '#0f172a', letterSpacing: -0.5 }}>
              Everything your squad needs
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: '0.9rem', color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>
              Six powerful tools built for serious study groups.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Box sx={{
                    p: 3, borderRadius: '16px',
                    bgcolor: cardBg,
                    border: '1px solid', borderColor,
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.05)',
                    height: '100%',
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: feat.color + '33',
                      boxShadow: `0 8px 28px ${feat.color}14`,
                      transform: 'translateY(-2px)',
                    },
                  }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, bgcolor: feat.color, opacity: 0.7, borderRadius: '16px 16px 0 0' }} />

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: feat.color + '16', flexShrink: 0 }}>
                        <Icon size={18} color={feat.color} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                          <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'white' : '#0f172a' }}>
                            {feat.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={feat.badge} size="small"
                          sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, bgcolor: feat.color + '14', color: feat.color, fontFamily: FONT }}
                        />
                      </Box>
                    </Box>

                    <Typography sx={{ fontFamily: FONT, fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        </Box>

        {/* Quick stats row */}
        <Box sx={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
          p: 3, borderRadius: '16px', bgcolor: cardBg,
          border: '1px solid', borderColor,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.05)',
        }}>
          {[
            { icon: Shield, label: 'End-to-end encrypted', color: '#22c55e' },
            { icon: Clock, label: 'Sessions saved forever', color: '#6366f1' },
            { icon: MessageSquare, label: 'Persistent chat history', color: '#f59e0b' },
          ].map(({ icon: Icon, label, color }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: '8px', bgcolor: color + '14', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </Box>
              <Typography sx={{ fontFamily: FONT, fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.3 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
