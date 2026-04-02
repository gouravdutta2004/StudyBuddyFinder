import { useState, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Checkbox } from '@mui/material';
import { CheckSquare, Plus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLS = ['todo', 'doing', 'done'];
const COL_LABELS = { todo: 'To Do', doing: 'In Progress', done: 'Done ✓' };
const COL_COLORS = { todo: '#6366f1', doing: '#f59e0b', done: '#10b981' };

export default function TaskBoard({ socket, roomId, isDark }) {
  const [tasks, setTasks] = useState([]); // { id, text, col }
  const [draft, setDraft] = useState('');
  const bg = isDark ? '#18181b' : '#f4f4f5';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const text = isDark ? '#f4f4f5' : '#18181b';
  const muted = isDark ? '#52525b' : '#a1a1aa';

  useEffect(() => {
    if (!socket) return;
    socket.on('task:add', t => setTasks(p => [...p, t]));
    socket.on('task:move', ({ id, col }) => setTasks(p => p.map(t => t.id === id ? { ...t, col } : t)));
    socket.on('task:remove', ({ id }) => setTasks(p => p.filter(t => t.id !== id)));
    socket.on('task:sync', ts => setTasks(ts));
    return () => { socket.off('task:add'); socket.off('task:move'); socket.off('task:remove'); socket.off('task:sync'); };
  }, [socket]);

  const addTask = () => {
    if (!draft.trim()) return;
    const t = { id: `${Date.now()}`, text: draft.trim(), col: 'todo' };
    socket?.emit('task:add', { roomId, task: t });
    setTasks(p => [...p, t]);
    setDraft('');
  };

  const move = (id, currentCol) => {
    const next = COLS[COLS.indexOf(currentCol) + 1];
    if (!next) return;
    socket?.emit('task:move', { roomId, id, col: next });
    setTasks(p => p.map(t => t.id === id ? { ...t, col: next } : t));
  };

  const remove = (id) => {
    socket?.emit('task:remove', { roomId, id });
    setTasks(p => p.filter(t => t.id !== id));
  };

  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: bg, border: `1px solid ${border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <CheckSquare size={15} color="#6366f1" />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#6366f1' }}>Task Board</Typography>
      </Box>

      {/* Add task */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
        <TextField size="small" fullWidth placeholder="Add a task..." value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          sx={{ '& .MuiInputBase-root': { bgcolor: isDark ? '#27272a' : '#fff', color: text, fontSize: '0.72rem', borderRadius: 2 }, '& fieldset': { borderColor: border } }}
        />
        <IconButton size="small" onClick={addTask} sx={{ bgcolor: '#6366f122', color: '#6366f1' }}><Plus size={14} /></IconButton>
      </Box>

      {COLS.map(col => {
        const colTasks = tasks.filter(t => t.col === col);
        const accent = COL_COLORS[col];
        return (
          <Box key={col} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>
                {COL_LABELS[col]} ({colTasks.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <AnimatePresence>
                {colTasks.map(t => (
                  <motion.div key={t.id} layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 1, borderRadius: 2, bgcolor: isDark ? '#27272a' : '#fff', border: `1px solid ${border}` }}>
                      <Checkbox size="small" checked={col === 'done'} onChange={() => move(t.id, col)}
                        sx={{ p: 0, color: muted, '&.Mui-checked': { color: accent } }} />
                      <Typography sx={{ flex: 1, fontSize: '0.7rem', color: text, textDecoration: col === 'done' ? 'line-through' : 'none', opacity: col === 'done' ? 0.6 : 1 }} noWrap>
                        {t.text}
                      </Typography>
                      {col !== 'done' && (
                        <IconButton size="small" onClick={() => move(t.id, col)} sx={{ p: 0.25, color: accent }}>
                          <ArrowRight size={11} />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => remove(t.id)} sx={{ p: 0.25, color: muted, '&:hover': { color: '#ef4444' } }}>
                        <Trash2 size={11} />
                      </IconButton>
                    </Box>
                  </motion.div>
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && (
                <Typography sx={{ fontSize: '0.6rem', color: muted, textAlign: 'center', py: 0.5, fontStyle: 'italic' }}>empty</Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
