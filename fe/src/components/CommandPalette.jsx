import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Search, FileText, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
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

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label="Global Command Menu"
          className="command-dialog"
          style={{
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="command-container"
          >
            <Box className="command-header">
              <Search size={18} color="rgba(255,255,255,0.5)" />
              <Command.Input placeholder="Type a command or search..." className="command-input" autoFocus />
            </Box>

            <Command.List className="command-list">
              <Command.Empty className="command-empty">No results found.</Command.Empty>

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
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}
