import React, { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton } from '@mui/material';
import { Plus, Trash, CheckCircle2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from "../../api/axios";
import toast from 'react-hot-toast';

export default function SquadKanban({ groupId, initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const columns = ['To Do', 'Doing', 'Done'];

  const saveTasks = async (newTasks) => {
    try {
      await api.put(`/groups/${groupId}/kanban`, { kanbanTasks: newTasks });
    } catch {
      toast.error('Failed to save tasks');
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = { id: Date.now().toString(), title: newTaskTitle, status: 'To Do' };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTaskTitle('');
    saveTasks(updated);
  };

  const deleteTask = (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Make it look clean while dragging
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTaskId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const updated = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return { ...t, status: targetStatus };
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    setDraggedTaskId(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#020617', minHeight: '600px', borderRadius: '32px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="900" color="white">Kanban Board</Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: '400px' } }}>
          <TextField 
            size="small" fullWidth placeholder="What needs to be done?" 
            value={newTaskTitle} 
            onChange={e => setNewTaskTitle(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && addTask()}
            sx={{ input: { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)', borderRadius: '100px' } }}
          />
          <Button variant="contained" onClick={addTask} sx={{ borderRadius: '100px', minWidth: '40px', p: 0, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
            <Plus size={20} />
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, minHeight: '500px' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          const isDone = col === 'Done';
          
          return (
            <Box 
              key={col} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              sx={{ 
                width: 320, flexShrink: 0, p: 2, 
                bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '24px', display: 'flex', flexDirection: 'column' 
              }}
            >
              <Typography variant="h6" fontWeight="800" color="white" mb={3} display="flex" alignItems="center" gap={1}>
                {isDone && <CheckCircle2 size={18} color="#10b981" />}
                {col} <Typography component="span" sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 1.5, py: 0.5, borderRadius: '100px', fontSize: '0.8rem' }}>{colTasks.length}</Typography>
              </Typography>

              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <AnimatePresence>
                  {colTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Box
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        sx={{ 
                          p: 2.5, bgcolor: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.05)', 
                          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '16px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 2,
                          '&:active': { cursor: 'grabbing' } 
                        }}
                      >
                        <GripVertical size={16} color="rgba(255,255,255,0.3)" style={{ cursor: 'grab' }} />
                        <Typography fontWeight="600" color={isDone ? 'rgba(255,255,255,0.5)' : 'white'} sx={{ flexGrow: 1, textDecoration: isDone ? 'line-through' : 'none' }}>
                          {task.title}
                        </Typography>
                        <IconButton size="small" onClick={() => deleteTask(task.id)} sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                          <Trash size={16} />
                        </IconButton>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {colTasks.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    <Typography color="rgba(255,255,255,0.3)" variant="body2">Drop tasks here</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
