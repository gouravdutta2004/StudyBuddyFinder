import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, LinearProgress } from '@mui/material';
import { BarChart2, Plus, Trash2, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function LivePoll({ socket, roomId, session, isDark }) {
  const { user } = useAuth();
  const isHost = session?.host?._id === user?._id || session?.host === user?._id;

  const [poll, setPoll] = useState(null);   // { question, options: [{text,votes,voters:[]}] }
  const [voted, setVoted] = useState(null); // option index
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ question: '', options: ['', ''] });

  const bg = isDark ? '#18181b' : '#f4f4f5';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const text = isDark ? '#f4f4f5' : '#18181b';
  const accent = '#8b5cf6';

  useEffect(() => {
    if (!socket) return;
    const onNew = (p) => { setPoll(p); setVoted(null); };
    const onVote = (p) => setPoll(p);
    const onEnd = () => setPoll(null);
    socket.on('poll:new', onNew);
    socket.on('poll:update', onVote);
    socket.on('poll:end', onEnd);
    return () => { socket.off('poll:new', onNew); socket.off('poll:update', onVote); socket.off('poll:end', onEnd); };
  }, [socket]);

  const launch = () => {
    if (!draft.question.trim() || draft.options.filter(o => o.trim()).length < 2) return;
    const newPoll = {
      question: draft.question,
      options: draft.options.filter(o => o.trim()).map(text => ({ text, votes: 0, voters: [] }))
    };
    socket?.emit('poll:create', { roomId, poll: newPoll });
    setPoll(newPoll); setCreating(false); setVoted(null);
    setDraft({ question: '', options: ['', ''] });
  };

  const vote = (idx) => {
    if (voted !== null) return;
    setVoted(idx);
    socket?.emit('poll:vote', { roomId, optionIndex: idx, userId: user._id });
  };

  const endPoll = () => { socket?.emit('poll:end', { roomId }); setPoll(null); };

  const totalVotes = poll?.options.reduce((s, o) => s + o.votes, 0) || 0;

  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: bg, border: `1px solid ${border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart2 size={15} color={accent} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>Live Poll</Typography>
        </Box>
        {isHost && !poll && (
          <IconButton size="small" onClick={() => setCreating(v => !v)} sx={{ bgcolor: `${accent}22`, color: accent, '&:hover': { bgcolor: `${accent}44` } }}>
            {creating ? <X size={14} /> : <Plus size={14} />}
          </IconButton>
        )}
        {isHost && poll && (
          <IconButton size="small" onClick={endPoll} sx={{ bgcolor: '#ef444422', color: '#ef4444' }}><X size={14} /></IconButton>
        )}
      </Box>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              <TextField size="small" placeholder="Poll question..." value={draft.question}
                onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
                sx={{ '& .MuiInputBase-root': { bgcolor: isDark ? '#27272a' : '#fff', color: text, borderRadius: 2, fontSize: '0.75rem' }, '& fieldset': { borderColor: border } }}
              />
              {draft.options.map((opt, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5 }}>
                  <TextField size="small" placeholder={`Option ${i + 1}`} value={opt} fullWidth
                    onChange={e => { const o = [...draft.options]; o[i] = e.target.value; setDraft(d => ({ ...d, options: o })); }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: isDark ? '#27272a' : '#fff', color: text, borderRadius: 2, fontSize: '0.72rem' }, '& fieldset': { borderColor: border } }}
                  />
                  {draft.options.length > 2 && <IconButton size="small" onClick={() => setDraft(d => ({ ...d, options: d.options.filter((_, j) => j !== i) }))}><Trash2 size={12} color="#ef4444" /></IconButton>}
                </Box>
              ))}
              {draft.options.length < 4 && (
                <Button size="small" startIcon={<Plus size={12} />} onClick={() => setDraft(d => ({ ...d, options: [...d.options, ''] }))}
                  sx={{ color: accent, fontSize: '0.65rem', textTransform: 'none', justifyContent: 'flex-start', p: 0 }}>Add option</Button>
              )}
              <Button size="small" variant="contained" startIcon={<Send size={12} />} onClick={launch}
                sx={{ bgcolor: accent, '&:hover': { bgcolor: '#7c3aed' }, fontSize: '0.7rem', textTransform: 'none', borderRadius: 2 }}>Launch Poll</Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active poll */}
      {poll ? (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: text, mb: 1.5 }}>{poll.question}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {poll.options.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              return (
                <Box key={i} onClick={() => vote(i)} sx={{ cursor: voted === null ? 'pointer' : 'default', borderRadius: 2, overflow: 'hidden', border: `1px solid ${voted === i ? accent : border}`, bgcolor: isDark ? '#27272a' : '#fff', transition: 'border-color 0.2s', '&:hover': voted === null ? { borderColor: accent } : {} }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, pt: 1, pb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: voted === i ? accent : text }}>{opt.text}</Typography>
                    {voted !== null && <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: accent }}>{pct}%</Typography>}
                  </Box>
                  {voted !== null && (
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ transformOrigin: 'left' }}>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 3, '& .MuiLinearProgress-bar': { bgcolor: accent } }} />
                    </motion.div>
                  )}
                </Box>
              );
            })}
          </Box>
          <Typography sx={{ fontSize: '0.6rem', color: isDark ? '#52525b' : '#a1a1aa', mt: 1, textAlign: 'right' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Typography>
        </Box>
      ) : !creating && (
        <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#52525b' : '#a1a1aa', textAlign: 'center', py: 1 }}>
          {isHost ? 'Click + to launch a poll' : 'No active poll'}
        </Typography>
      )}
    </Box>
  );
}
