import React, { useState } from 'react';
import { Box, Typography, Button, Container, MenuItem, Select, FormControl, InputLabel, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, CheckCircle } from 'lucide-react';

export default function PlayableSandbox() {
  const [major, setMajor] = useState('');
  const [needs, setNeeds] = useState('');
  const [teaches, setTeaches] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);

  const handleScan = () => {
    if (!major || !needs || !teaches) return;
    setScanning(true);
    setResults([]);
    
    // Simulate AI scanning
    setTimeout(() => {
      setScanning(false);
      setResults([
        { id: 1, name: 'Alex M.', role: 'Computer Science', match: '98%', text: `Can teach ${needs}, wants to learn ${teaches}` },
        { id: 2, name: 'Sarah J.', role: 'Mathematics', match: '91%', text: `Mutual interest in ${major}` },
        { id: 3, name: 'David K.', role: 'Engineering', match: '87%', text: `Similar study velocity & timezone` }
      ]);
    }, 2000);
  };

  return (
    <Container maxWidth="md" sx={{ py: 15, position: 'relative', zIndex: 10 }}>
      <Box sx={{ p: 4, borderRadius: '32px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>
        
        <Typography variant="h3" fontWeight={900} color="white" mb={2} textAlign="center" sx={{ letterSpacing: '-1px' }}>Try the Algorithm.</Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.6)" mb={5} textAlign="center">Experience our smart matchmaking right here. Select your parameters below.</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 3, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>My Major</InputLabel>
            <Select value={major} onChange={(e) => setMajor(e.target.value)} label="My Major">
              <MenuItem value="Computer Science">Computer Science</MenuItem>
              <MenuItem value="Physics">Physics</MenuItem>
              <MenuItem value="Mathematics">Mathematics</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 3, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>I need help with</InputLabel>
            <Select value={needs} onChange={(e) => setNeeds(e.target.value)} label="I need help with">
              <MenuItem value="Algorithms">Algorithms</MenuItem>
              <MenuItem value="Calculus">Calculus</MenuItem>
              <MenuItem value="Quantum Mechanics">Quantum Mechanics</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 3, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>I can teach</InputLabel>
            <Select value={teaches} onChange={(e) => setTeaches(e.target.value)} label="I can teach">
              <MenuItem value="Data Structures">Data Structures</MenuItem>
              <MenuItem value="Linear Algebra">Linear Algebra</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={handleScan}
            disabled={!major || !needs || !teaches || scanning}
            sx={{ 
              bgcolor: '#6366f1', color: 'white', borderRadius: 8, px: 5, py: 1.5, fontWeight: 800, textTransform: 'none',
              '&:hover': { bgcolor: '#4f46e5' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
            }}
          >
            {scanning ? 'Scanning Network...' : 'Run Matchmaker'}
          </Button>
        </Box>

        {/* Animation & Results Area */}
        <Box sx={{ mt: 5, minHeight: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={24} color="#818cf8" />
                  </Box>
                </motion.div>
                <Typography variant="body1" color="#818cf8" fontWeight={700} sx={{ letterSpacing: 2 }}>ANALYZING 10,000+ PROFILES</Typography>
              </motion.div>
            )}

            {results.length > 0 && (
              <Box key="results" sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map((res, i) => (
                  <motion.div 
                    key={res.id}
                    initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", delay: i * 0.15 }}
                  >
                    <Box sx={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3, 
                      bgcolor: 'rgba(0,0,0,0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: i === 0 ? '#10b981' : '#6366f1' }}>{res.name[0]}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" color="white" fontWeight={700}>{res.name}</Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.5)">{res.text}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="#10b981" fontWeight={900} display="flex" alignItems="center" gap={0.5}>
                          <CheckCircle size={18} /> {res.match}
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.4)">Match Score</Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </AnimatePresence>
        </Box>

      </Box>
    </Container>
  );
}
