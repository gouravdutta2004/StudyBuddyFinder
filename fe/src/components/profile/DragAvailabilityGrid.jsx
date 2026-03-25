import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DragAvailabilityGrid({ availability, onChange }) {
  const theme = useTheme();
  // gridState: { "Monday-09": true, ... }
  const [gridState, setGridState] = useState({});
  const [isClicking, setIsClicking] = useState(false);
  const [paintMode, setPaintMode] = useState(true); // true = painting, false = erasing

  useEffect(() => {
    // Map initial availability (e.g., [{day: "Monday", startTime: "09:00", endTime: "11:00"}]) to gridState
    const initialGrid = {};
    availability.forEach(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0], 10);
      const endHour = parseInt(slot.endTime.split(':')[0], 10);
      for (let h = startHour; h < endHour; h++) {
        initialGrid[`${slot.day}-${h}`] = true;
      }
    });
    setGridState(initialGrid);
  }, [availability]);

  const handleApply = (newGrid) => {
    // Convert grid back to array of continuous slots
    const newAvail = [];
    DAYS.forEach(day => {
      let currentStart = null;
      for (let h = 0; h <= 24; h++) {
        const isSelected = h < 24 && newGrid[`${day}-${h}`];
        if (isSelected && currentStart === null) {
          currentStart = h;
        } else if (!isSelected && currentStart !== null) {
          newAvail.push({
            day,
            startTime: `${currentStart.toString().padStart(2, '0')}:00`,
            endTime: `${h.toString().padStart(2, '0')}:00`
          });
          currentStart = null;
        }
      }
    });
    onChange(newAvail);
  };

  const updateCell = (day, hour, state) => {
    setGridState(prev => {
      const next = { ...prev, [`${day}-${hour}`]: state };
      handleApply(next);
      return next;
    });
  };

  const handleMouseDown = (day, hour) => {
    setIsClicking(true);
    const currentlyActive = gridState[`${day}-${hour}`];
    setPaintMode(!currentlyActive);
    updateCell(day, hour, !currentlyActive);
  };

  const handleMouseEnter = (day, hour) => {
    if (isClicking) {
      updateCell(day, hour, paintMode);
    }
  };

  const handleMouseUp = () => {
    setIsClicking(false);
  };

  return (
    <Box 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp}
      sx={{ width: '100%', overflowX: 'auto', p: 1, userSelect: 'none' }}
    >
      <Box sx={{ display: 'flex', minWidth: 600 }}>
        {/* Time Labels Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', pr: 2, pt: 4 }}>
          {HOURS.filter(h => h % 2 === 0).map(h => (
            <Typography key={`t-${h}`} variant="caption" color="text.secondary" sx={{ height: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', pr: 1 }}>
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </Typography>
          ))}
        </Box>

        {/* Days Columns */}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {DAYS.map(day => (
            <Box key={day} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', px: 0.5 }}>
              <Typography variant="caption" fontWeight={700} textAlign="center" sx={{ mb: 1, height: 24 }}>
                {day.substring(0, 3)}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {HOURS.map(hour => {
                  const isActive = gridState[`${day}-${hour}`];
                  return (
                    <Box
                      key={`${day}-${hour}`}
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                      sx={{
                        height: 20, // 2 slots = 1 hour visually mapping 
                        bgcolor: isActive ? '#10b981' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#e5e7eb',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s',
                        '&:hover': {
                          bgcolor: isActive ? '#059669' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#d1d5db'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, px: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Click and drag to "paint" your free time blocks visually!
        </Typography>
        <Button size="small" variant="text" color="error" onClick={() => { setGridState({}); onChange([]); }}>
          Clear Grid
        </Button>
      </Box>
    </Box>
  );
}
