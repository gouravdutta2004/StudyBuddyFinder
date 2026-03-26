import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function Logo({ size = 36, showText = true, textColor }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Animated SVG Icon */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Gradients & Glow */}
          <defs>
            <linearGradient id="sf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <rect width="100" height="100" rx="30" fill="url(#sf-grad)" filter="url(#glow)" opacity="0.3" />
          <rect width="100" height="100" rx="26" fill="url(#sf-grad)" />

          {/* S & F Monogram / Infinity Ribbon */}
          <path d="M 68 32 C 68 32 50 25 35 35 C 20 45 40 55 50 60 C 60 65 80 75 65 85 C 50 95 32 88 32 88" 
                stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Abstract Nodes representing Friends */}
          <circle cx="68" cy="32" r="8" fill="#fbcfe8" />
          <circle cx="32" cy="88" r="8" fill="#c7d2fe" />
          
          {/* Book/Connecting lines accent */}
          <path d="M 35 48 L 48 48" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
          <path d="M 35 62 L 42 62" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Brand Name Text */}
      {showText && (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 900, 
            fontSize: size * 0.6, 
            letterSpacing: '-0.5px', 
            userSelect: 'none',
            color: textColor || 'inherit',
            background: textColor ? 'none' : 'linear-gradient(90deg, #4f46e5 0%, #ec4899 100%)',
            WebkitBackgroundClip: textColor ? 'initial' : 'text',
            WebkitTextFillColor: textColor ? 'initial' : 'transparent',
            display: 'inline-block',
            lineHeight: 1
          }}
        >
          StudyFriend
        </Typography>
      )}
    </Box>
  );
}
