import React, { useCallback, useState } from 'react';
import { Dialog, Box, IconButton, Typography, useTheme } from '@mui/material';
import { X, Network } from 'lucide-react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

export default function MindMapModal({ open, onClose, user }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Generate nodes from user's subjects
  const initialNodes = [
    {
      id: 'root',
      type: 'input',
      data: { label: user?.name ? `${user.name}'s Brain` : 'My Brain' },
      position: { x: 250, y: 150 },
      style: { background: isDark ? '#1e293b' : 'white', color: isDark ? 'white' : 'black', border: '2px solid #6366f1', borderRadius: '50%', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }
    }
  ];

  const initialEdges = [];
  
  (user?.subjects || []).forEach((subject, idx) => {
    const angle = (idx / (user.subjects.length || 1)) * 2 * Math.PI;
    const r = 200;
    initialNodes.push({
      id: `sub-${idx}`,
      data: { label: subject },
      position: { x: 250 + r * Math.cos(angle), y: 150 + r * Math.sin(angle) },
      style: { background: isDark ? '#334155' : '#f8fafc', color: isDark ? 'white' : 'black', border: '1px solid #10b981', borderRadius: '20px', padding: '10px 20px', fontWeight: 700 }
    });
    initialEdges.push({
      id: `e-root-${idx}`,
      source: 'root',
      target: `sub-${idx}`,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 }
    });
  });

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', height: '80vh' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid rgba(150,150,150,0.1)', bgcolor: theme.palette.background.paper }}>
        <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
          <Network size={20} color="#6366f1" /> Neural Map
        </Typography>
        <IconButton onClick={onClose}><X size={20} /></IconButton>
      </Box>
      <Box sx={{ flex: 1, width: '100%', height: '100%', bgcolor: isDark ? '#020617' : '#f8fafc' }}>
        {open && (
           <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background color={isDark ? "#334155" : "#cbd5e1"} gap={16} />
            <Controls />
            <MiniMap nodeColor={isDark ? '#475569' : '#e2e8f0'} maskColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} />
          </ReactFlow>
        )}
      </Box>
    </Dialog>
  );
}
