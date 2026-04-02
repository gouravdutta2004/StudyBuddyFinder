import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Slider, Select, MenuItem, Tooltip } from '@mui/material';
import { Music, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRACKS = [
  { label: 'Lo-Fi Hip Hop', id: 'jfKfPfyJRdk', emoji: '🎵' },
  { label: 'Deep Focus', id: 'lTRiuFIWV54', emoji: '🧠' },
  { label: 'Nature Sounds', id: 'eKFTSSKCzWA', emoji: '🌿' },
  { label: 'White Noise', id: 'nMfPqeZjc2c', emoji: '❄️' },
  { label: 'Jazz Study', id: 'Dx5qFachd3A', emoji: '🎷' },
];

export default function AmbientMusic({ isDark }) {
  const [open, setOpen] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);
  const [muted, setMuted] = useState(false);
  const [player, setPlayer] = useState(null);

  const bg = isDark ? '#18181b' : '#f4f4f5';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const accent = '#ec4899';
  const track = TRACKS[trackIdx];

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  useEffect(() => {
    if (player && player.loadVideoById) {
      player.loadVideoById(track.id);
      if (!playing) player.stopVideo();
    }
  }, [trackIdx]);

  const initPlayer = () => {
    const p = new window.YT.Player('yt-ambient-player', {
      height: '0', width: '0',
      videoId: TRACKS[0].id,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: TRACKS[0].id },
      events: {
        onReady: (e) => { e.target.setVolume(40); setPlayer(e.target); }
      }
    });
  };

  const togglePlay = () => {
    if (!player) return;
    if (playing) { player.stopVideo(); } else { player.playVideo(); player.setVolume(muted ? 0 : volume); }
    setPlaying(p => !p);
  };

  const nextTrack = () => setTrackIdx(i => (i + 1) % TRACKS.length);

  const handleVolume = (_, val) => {
    setVolume(val);
    if (player) player.setVolume(val);
    if (val > 0) setMuted(false);
  };

  const toggleMute = () => {
    setMuted(m => { if (player) player.setVolume(!m ? 0 : volume); return !m; });
  };

  return (
    <Box sx={{ borderRadius: 3, bgcolor: bg, border: `1px solid ${border}`, overflow: 'hidden' }}>
      <div id="yt-ambient-player" style={{ display: 'none' }} />

      <Box
        onClick={() => setOpen(o => !o)}
        sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: isDark ? '#27272a' : '#e4e4e7' }, transition: 'background 0.2s' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Music size={15} color={accent} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: accent }}>Ambient Music</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {playing && (
            <Box sx={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 14 }}>
              {[4, 8, 5, 10, 6].map((h, i) => (
                <motion.div key={i} animate={{ height: [h, h * 2, h] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  style={{ width: 2, backgroundColor: accent, borderRadius: 2 }} />
              ))}
            </Box>
          )}
          <Typography sx={{ fontSize: '0.6rem', color: isDark ? '#52525b' : '#a1a1aa' }}>
            {track.emoji} {track.label}
          </Typography>
        </Box>
      </Box>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1.5, borderTop: `1px solid ${border}`, pt: 1.5 }}>
              <Select
                size="small" value={trackIdx} onChange={e => setTrackIdx(e.target.value)}
                sx={{ fontSize: '0.72rem', bgcolor: isDark ? '#27272a' : '#fff', color: isDark ? '#f4f4f5' : '#18181b', '& fieldset': { borderColor: border }, borderRadius: 2 }}
              >
                {TRACKS.map((t, i) => (
                  <MenuItem key={i} value={i} sx={{ fontSize: '0.72rem' }}>{t.emoji} {t.label}</MenuItem>
                ))}
              </Select>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton size="small" onClick={togglePlay} sx={{ bgcolor: `${accent}22`, color: accent, '&:hover': { bgcolor: `${accent}44` } }}>
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </IconButton>
                <IconButton size="small" onClick={nextTrack} sx={{ bgcolor: isDark ? '#27272a' : '#e4e4e7', color: isDark ? '#a1a1aa' : '#71717a' }}>
                  <SkipForward size={14} />
                </IconButton>
                <IconButton size="small" onClick={toggleMute}>
                  {muted ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} color={isDark ? '#a1a1aa' : '#71717a'} />}
                </IconButton>
                <Slider size="small" value={muted ? 0 : volume} onChange={handleVolume} min={0} max={100}
                  sx={{ color: accent, flex: 1, '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
