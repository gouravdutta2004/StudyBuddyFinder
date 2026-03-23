import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useScroll, useVelocity, useTransform, useAnimationFrame, useSpring, useMotionValue } from 'framer-motion';

function wrap(min, max, v) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

export default function VelocityMarquee({ baseVelocity = 2 }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);
  const directionFactor = useRef(1);

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    // Change direction based on scroll velocity (reverses on upward scroll)
    if (velocityFactor.get() < 0) { directionFactor.current = -1; } 
    else if (velocityFactor.get() > 0) { directionFactor.current = 1; }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  const words = ["Harvard University", "MIT", "Stanford", "Oxford", "Cambridge", "UC Berkeley", "Yale", "Princeton"];

  return (
    <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap', py: 6, mt: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="subtitle2" color="rgba(255,255,255,0.4)" textAlign="center" fontWeight={700} sx={{ letterSpacing: 2, textTransform: 'uppercase' }}>
        Trusted by students from
      </Typography>
      <motion.div style={{ x, display: 'inline-flex', gap: '5rem', paddingRight: '5rem' }}>
        {[...words, ...words, ...words, ...words].map((word, i) => (
          <Typography key={i} variant="h3" fontWeight={900} sx={{ color: 'rgba(255,255,255,0.05)', WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>
            {word}
          </Typography>
        ))}
      </motion.div>
    </Box>
  );
}
