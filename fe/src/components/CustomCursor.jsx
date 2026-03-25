import React, { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const ArrowIcon = ({ isDark, isHovering }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path
      d="M1 1L8 21L11.5 12.5L20 9L1 1Z"
      fill={isHovering ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#ffffff' : '#020617')}
      stroke={isDark ? '#020617' : '#ffffff'}
      strokeWidth="1.5"
      strokeLinejoin="round"
      style={{ transition: 'fill 0.2s ease' }}
    />
  </svg>
);

export default function CustomCursor({ isMobile }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Instant tracking for the arrow tip
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isMobile) return;

    const moveCursor = (e) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleElementHover = (e) => {
      const target = e.target;
      const computedStyle = window.getComputedStyle(target);
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') || target.closest('a') ||
        computedStyle.cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseEnter);
    window.addEventListener('mouseover', handleElementHover);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseEnter);
      window.removeEventListener('mouseover', handleElementHover);
    };
  }, [dotX, dotY, isVisible, isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <>
      <style>
        {`
          @media (hover: hover) and (pointer: fine) {
            * {
              cursor: none !important;
            }
          }
        `}
      </style>

      {/* Instant SVG Arrow Tip */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 99999,
          // Shift exactly 1px to offset the SVG M1 1 start point, landing the click point on 0,0
          marginLeft: '-1px',
          marginTop: '-1px'
        }}
        animate={{
          scale: isHovering ? 0.9 : 1,
          rotate: isHovering ? -8 : 0
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <ArrowIcon isDark={isDark} isHovering={isHovering} />
      </motion.div>
    </>
  );
}
