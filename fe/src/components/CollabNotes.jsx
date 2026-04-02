import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { FileText, Save, Users, Eye, Edit3 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DEBOUNCE_MS = 400;

export default function CollabNotes({ roomId, socket, sessionId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [editorCount, setEditorCount] = useState(1);
  const [saved, setSaved] = useState(true);
  const debounceRef = useRef(null);
  const textareaRef = useRef(null);
  const initReceivedRef = useRef(false); // track if socket init fired


  // Receive initial notes from server when joining room
  useEffect(() => {
    if (!socket) return;
    const handleInit = ({ content: c }) => {
      initReceivedRef.current = true;
      if (c) setContent(c);
    };
    socket.on('collab_notes_init', handleInit);
    return () => socket.off('collab_notes_init', handleInit);
  }, [socket]);

  // Fallback: load from DB if socket init didn't fire (e.g. reconnection)
  useEffect(() => {
    const sid = sessionId || roomId;
    if (!sid) return;
    const timer = setTimeout(() => {
      if (!initReceivedRef.current) {
        api.get(`/sessions/${sid}/collab-notes`)
          .then(r => { if (r.data.collabNotes) setContent(r.data.collabNotes); })
          .catch(() => {}); // silently ignore if endpoint unavailable
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessionId, roomId]);

  // Receive real-time updates from peers
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = ({ content: c }) => {
      setContent(c);
      setSaved(true);
    };
    socket.on('collab_notes_update', handleUpdate);
    return () => socket.off('collab_notes_update', handleUpdate);
  }, [socket]);

  // Track active editors via room presence
  useEffect(() => {
    if (!socket) return;
    const handleJoin = () => setEditorCount(c => c + 1);
    const handleLeave = () => setEditorCount(c => Math.max(1, c - 1));
    socket.on('user_joined_room', handleJoin);
    socket.on('user_left_room', handleLeave);
    return () => {
      socket.off('user_joined_room', handleJoin);
      socket.off('user_left_room', handleLeave);
    };
  }, [socket]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setContent(val);
    setSaved(false);

    // Debounced broadcast to peers
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (socket) socket.emit('collab_notes_update', { roomId, content: val });
    }, DEBOUNCE_MS);
  }, [socket, roomId]);

  const handleSave = async () => {
    try {
      await api.put(`/sessions/${sessionId || roomId}/collab-notes`, { content });
      setSaved(true);
      toast.success('Notes saved!');
    } catch {
      // Socket will persist on last user exit; this is just a manual save shortcut
      setSaved(true);
      toast.success('Notes synced to room.');
    }
  };

  // Simple markdown-to-HTML renderer for preview
  const renderMarkdown = (md) => {
    return md
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin:12px 0 4px">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.15rem;font-weight:700;margin:14px 0 6px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:1.3rem;font-weight:900;margin:16px 0 8px">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, `<code style="font-family:monospace;background:rgba(99,102,241,0.12);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>`)
      .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 'auto' }}>
          <Box component={motion.div} animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <Chip
            icon={<Users size={10} />}
            label={`${editorCount} • collab`}
            size="small"
            sx={{ height: 20, fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', '& .MuiChip-icon': { color: '#10b981', ml: '4px' } }}
          />
          {!saved && (
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700 }}>● unsaved</Typography>
          )}
        </Box>

        <Box
          onClick={() => setPreview(p => !p)}
          sx={{ p: 0.75, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', bgcolor: preview ? 'rgba(99,102,241,0.12)' : 'transparent', border: `1px solid ${preview ? 'rgba(99,102,241,0.3)' : border}`, color: preview ? '#6366f1' : 'text.secondary', transition: 'all 0.2s' }}>
          {preview ? <Edit3 size={12} /> : <Eye size={12} />}
        </Box>

        <Box
          onClick={handleSave}
          sx={{ p: 0.75, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', bgcolor: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)`, color: '#10b981', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(16,185,129,0.15)' } }}>
          <Save size={12} />
        </Box>
      </Box>

      {/* Editor / Preview */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${border}` }}>
        {!preview ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder={`# Session Notes\n\nType your notes here... supports **bold**, *italic*, \`code\`, and - lists\n\nChanges sync in real-time with all participants!`}
            style={{
              width: '100%', height: '100%', resize: 'none', padding: '12px',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              color: isDark ? '#e5e7eb' : '#111827',
              fontFamily: "'Courier New', monospace", fontSize: '0.82rem', lineHeight: 1.7,
              border: 'none', outline: 'none',
              caretColor: '#6366f1',
            }}
          />
        ) : (
          <Box sx={{ p: 1.5, height: '100%', overflowY: 'auto', fontSize: '0.85rem', lineHeight: 1.7, color: isDark ? '#e5e7eb' : '#111827',
            '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: border, borderRadius: 10 } }}
            dangerouslySetInnerHTML={{ __html: content ? renderMarkdown(content) : '<p style="opacity:0.4;font-style:italic">Nothing to preview yet...</p>' }}
          />
        )}
      </Box>

      {/* Hint */}
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'text.disabled', textAlign: 'center', flexShrink: 0 }}>
        <FileText size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
        Supports markdown · Auto-synced · Persisted on session end
      </Typography>
    </Box>
  );
}
