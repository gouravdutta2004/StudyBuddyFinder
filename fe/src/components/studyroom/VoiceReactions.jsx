import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const REACTIONS = [
  { emoji: '👏', label: 'Clap',      color: '#f59e0b' },
  { emoji: '🔥', label: 'Fire',      color: '#ef4444' },
  { emoji: '😂', label: 'Laugh',     color: '#10b981' },
  { emoji: '😕', label: 'Confused',  color: '#6366f1' },
  { emoji: '💡', label: 'Idea',      color: '#06b6d4' },
  { emoji: '❤️', label: 'Love',      color: '#ec4899' },
];

let uid = 0;

export default function VoiceReactions({ socket, roomId }) {
  const { user } = useAuth();
  const [particles, setParticles] = useState([]); // { id, emoji, x, color }
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onReaction = ({ emoji, color }) => spawnParticle(emoji, color);
    socket.on('reaction:emit', onReaction);
    return () => socket.off('reaction:emit', onReaction);
  }, [socket]);

  const spawnParticle = (emoji, color) => {
    const id = uid++;
    const x = 10 + Math.random() * 80; // % from left
    setParticles(p => [...p, { id, emoji, x, color }]);
    setTimeout(() => setParticles(p => p.filter(r => r.id !== id)), 2500);
  };

  const fire = (reaction) => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);
    spawnParticle(reaction.emoji, reaction.color);
    socket?.emit('reaction:emit', { roomId, emoji: reaction.emoji, color: reaction.color, userId: user?._id });
  };

  return (
    <>
      {/* Floating particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -200, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 90,
              left: `${p.x}%`,
              fontSize: '2rem',
              zIndex: 9999,
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 8px ${p.color})`,
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction bar at bottom */}
      <Box sx={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 1, zIndex: 9000,
        bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
        borderRadius: '100px', px: 2, py: 1,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {REACTIONS.map(r => (
          <Box
            key={r.emoji}
            component={motion.div}
            whileHover={{ scale: 1.25, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fire(r)}
            title={r.label}
            sx={{
              fontSize: '1.3rem', cursor: cooldown ? 'not-allowed' : 'pointer',
              opacity: cooldown ? 0.6 : 1,
              userSelect: 'none',
              filter: `drop-shadow(0 0 6px ${r.color}88)`,
              transition: 'filter 0.2s',
              '&:hover': { filter: `drop-shadow(0 0 10px ${r.color})` },
            }}
          >
            {r.emoji}
          </Box>
        ))}
      </Box>
    </>
  );
}
