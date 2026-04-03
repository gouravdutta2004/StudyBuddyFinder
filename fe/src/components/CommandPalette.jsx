import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Search, FileText, Settings, User, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setInputValue('');
        setAiResponse(null);
        setIsThinking(false);
      }, 300);
    }
  }, [open]);

  const handleAskAI = async () => {
    if (!inputValue.trim()) return;
    setIsThinking(true);
    setAiResponse(null);
    try {
      const res = await api.post('/ai/squad-tutor', {
        context: "You are Omni, the Global AI Assistant bound natively into the Command Palette of StudyFriend. Answer clearly, concisely, and beautifully using standard markdown.",
        question: inputValue
      });
      setAiResponse(res.data.answer);
    } catch {
      setAiResponse("**Connection Interrupted.** \nI could not securely reach the Whobee Core.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label="Global Command Menu"
          className="command-dialog"
          style={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`command-container ${aiResponse || isThinking ? 'ai-active' : ''}`}
          >
            <Box className="command-header">
              <Search size={18} color={aiResponse || isThinking ? "#c084fc" : "rgba(255,255,255,0.5)"} style={{ transition: 'color 0.3s' }} />
              <Command.Input 
                placeholder="Navigate or Ask AI anything..." 
                className="command-input" 
                autoFocus 
                value={inputValue}
                onValueChange={setInputValue}
                disabled={isThinking || aiResponse !== null}
              />
              {(aiResponse || isThinking) && (
                <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.1)', p: 0.5, borderRadius: '50%' }} onClick={() => { setAiResponse(null); setIsThinking(false); setInputValue(''); }}>
                  <X size={16} color="white" />
                </Box>
              )}
            </Box>

            {!aiResponse && !isThinking && (
              <Command.List className="command-list">
                <Command.Empty className="command-empty">
                  No routes match "{inputValue}". <br/> Press Enter or click below to ask AI instead.
                </Command.Empty>
                
                {inputValue.length > 2 && (
                  <Command.Group heading="Omni Intelligence">
                    <Command.Item onSelect={handleAskAI} className="command-item ai-trigger">
                      <Box className="item-icon glowing-icon"><Sparkles size={16} color="#c084fc" /></Box>
                      Ask AI: <strong style={{ marginLeft: '4px', color: '#e9d5ff' }}>"{inputValue}"</strong>
                    </Command.Item>
                  </Command.Group>
                )}

                <Command.Group heading="Navigation">
                  <Command.Item onSelect={() => { navigate('/dashboard'); setOpen(false); }} className="command-item">
                    <Box className="item-icon"><FileText size={16} /></Box>Dashboard
                  </Command.Item>
                  <Command.Item onSelect={() => { navigate('/browse'); setOpen(false); }} className="command-item">
                    <Box className="item-icon"><Search size={16} /></Box>Browse Buddies
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings">
                  <Command.Item onSelect={() => { navigate('/profile'); setOpen(false); }} className="command-item">
                    <Box className="item-icon"><User size={16} /></Box>Profile Settings
                  </Command.Item>
                  <Command.Item onSelect={() => { navigate('/billing'); setOpen(false); }} className="command-item">
                    <Box className="item-icon"><Settings size={16} /></Box>Billing & Plans
                  </Command.Item>
                </Command.Group>
              </Command.List>
            )}

            {/* Omni-Intelligence Response Block */}
            <AnimatePresence>
              {(isThinking || aiResponse) && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="ai-response-container"
                >
                   <Typography variant="caption" sx={{ letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#c084fc', fontWeight: 900, mb: 2 }}>
                     <Sparkles size={14} /> OMNI CORE
                   </Typography>
                   
                   {isThinking ? (
                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 4, justifyContent: 'center' }}>
                       <CircularProgress size={24} sx={{ color: '#c084fc' }} /> 
                       <Typography variant="body1" fontWeight={600} color="rgba(255,255,255,0.7)">Consulting Neural Network...</Typography>
                     </Box>
                   ) : (
                     <Box className="omni-markdown">
                        <ReactMarkdown>{aiResponse}</ReactMarkdown>
                     </Box>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}
