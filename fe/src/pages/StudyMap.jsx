import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow, OverlayView } from '@react-google-maps/api';
import {
  Box, Typography, Avatar, Button, Chip, Slider, Paper,
  CircularProgress, IconButton, TextField, InputAdornment, Divider,
  Tooltip, Badge,
} from '@mui/material';
import {
  Radar, Navigation, RefreshCw, Crosshair, Search, X, Activity,
  Wifi, MessageCircle, UserPlus, MapPin, GraduationCap, Star,
  ChevronRight, Users, Zap, Signal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LIBRARIES = ['places'];

// ── Design tokens ──
const R = '#10b981';   // neon green
const R2 = '#065f46';  // dark green
const BG = '#020617';  // deep space

const FREQ_COLORS = {
  Visual:            { color: '#f59e0b', glow: '#f59e0b66' },
  Auditory:          { color: '#10b981', glow: '#10b98166' },
  'Reading/Writing': { color: '#3b82f6', glow: '#3b82f666' },
  Kinesthetic:       { color: '#ef4444', glow: '#ef444466' },
  Mixed:             { color: '#8b5cf6', glow: '#8b5cf666' },
  Pomodoro:          { color: '#ec4899', glow: '#ec489966' },
  default:           { color: '#10b981', glow: '#10b98166' },
};

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#065f46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#042f2e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#10b981' }] },
];

function createBlip(color = R, isMe = false) {
  const w = isMe ? 44 : 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">
    <defs>
      <filter id="g">
        <feDropShadow dx="0" dy="0" stdDeviation="${isMe ? 8 : 5}" flood-color="${color}" flood-opacity="0.9"/>
      </filter>
    </defs>
    ${isMe ? `
      <circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 2}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.25"/>
      <circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 8}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
    ` : ''}
    <circle cx="${w / 2}" cy="${w / 2}" r="${isMe ? 7 : 5}" fill="${color}" filter="url(#g)"/>
    <line x1="${w / 2 - 3}" y1="${w / 2}" x2="${w / 2 + 3}" y2="${w / 2}" stroke="rgba(0,0,0,0.6)" stroke-width="1.5"/>
    <line x1="${w / 2}" y1="${w / 2 - 3}" x2="${w / 2}" y2="${w / 2 + 3}" stroke="rgba(0,0,0,0.6)" stroke-width="1.5"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(w, w),
    anchor: new window.google.maps.Point(w / 2, w / 2),
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Right-side blip detail panel ── */
function BlipPanel({ user: u, myPos, onClose, onConnect, onMessage, onViewProfile, sentReqs }) {
  if (!u) return null;
  const freq = FREQ_COLORS[u.studyStyle] || FREQ_COLORS.default;
  const coords = u.geoLocation?.coordinates;
  const dist = coords && myPos
    ? haversineKm(myPos.lat, myPos.lng, coords[1], coords[0]).toFixed(1)
    : null;
  const alreadySent = sentReqs.has(u._id);

  return (
    <motion.div
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      style={{
        position: 'absolute', top: 0, right: 0, height: '100%',
        width: 320, zIndex: 20,
        background: 'rgba(2, 6, 23, 0.96)',
        backdropFilter: 'blur(20px)',
        borderLeft: `2px solid ${freq.color}`,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'monospace',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${freq.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Crosshair size={16} color={freq.color} />
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: freq.color, letterSpacing: 2, fontSize: '0.8rem' }}>
            TARGET_NODE
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}>
          <X size={16} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, '&::-webkit-scrollbar': { display: 'none' } }}>
        {/* Avatar + Name */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            position: 'relative', mb: 1.5,
            '&::after': {
              content: '""', position: 'absolute', inset: -4,
              borderRadius: '50%', border: `2px solid ${freq.color}`,
              boxShadow: `0 0 16px ${freq.glow}`,
              animation: 'pulseRing 2s ease-in-out infinite',
            }
          }}>
            <Avatar src={u.avatar}
              sx={{ width: 80, height: 80, fontSize: '2rem', bgcolor: freq.color + '33', border: `3px solid ${freq.color}`, boxShadow: `0 0 24px ${freq.glow}` }}>
              {u.name?.[0]}
            </Avatar>
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'white', fontSize: '1rem', letterSpacing: 1 }}>
            {u.name?.toUpperCase()}
          </Typography>
          {u.university && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <GraduationCap size={12} color="rgba(255,255,255,0.4)" />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                {u.university}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Telemetry data */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2.5 }}>
          {[
            { label: 'LEVEL', value: u.level || 1, icon: Zap, color: '#f59e0b' },
            { label: 'XP', value: `${u.xp || 0}`, icon: Star, color: '#a78bfa' },
            { label: 'DIST', value: dist ? `${dist} km` : 'N/A', icon: MapPin, color: '#22d3ee' },
            { label: 'FREQ', value: (u.studyStyle || 'MIXED').slice(0, 7).toUpperCase(), icon: Signal, color: freq.color },
          ].map(({ label, value, icon: Icon, color }) => (
            <Box key={label} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', p: 1.5, textAlign: 'center' }}>
              <Icon size={14} color={color} style={{ marginBottom: 4 }} />
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: 'white', lineHeight: 1 }}>{value}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', letterSpacing: 1, mt: 0.25 }}>{label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Subjects */}
        {u.subjects?.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: freq.color, fontWeight: 900, letterSpacing: 2, mb: 1 }}>
              ▸ MODULES / {u.subjects.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {u.subjects.map(s => (
                <Chip key={s} label={s} size="small" sx={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: '0.6rem',
                  bgcolor: freq.color + '15', color: freq.color,
                  border: `1px solid ${freq.color}44`, borderRadius: '4px',
                  height: 20,
                }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Frequency ring visual */}
        <Box sx={{ mb: 2.5, py: 2, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: freq.color, fontWeight: 900, letterSpacing: 2, mb: 1.5 }}>
            ▸ SIGNAL FREQUENCY
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[...Array(12)].map((_, i) => {
              const height = Math.random() * 24 + 6;
              return (
                <Box key={i} component={motion.div}
                  animate={{ scaleY: [1, 1.5 + Math.random(), 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2 + Math.random() * 0.8, repeat: Infinity, delay: i * 0.08 }}
                  sx={{ flex: 1, height: `${height}px`, bgcolor: freq.color, borderRadius: '2px', transformOrigin: 'bottom' }}
                />
              );
            })}
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: freq.color, fontWeight: 700, mt: 1, textAlign: 'center', letterSpacing: 1 }}>
            {(u.studyStyle || 'MIXED').toUpperCase()} // ACTIVE SIGNAL
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: `1px solid ${freq.color}33`, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button fullWidth variant="contained" onClick={() => onViewProfile(u._id)}
          sx={{ bgcolor: freq.color, color: '#000', borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.72rem', py: 1, letterSpacing: 2, '&:hover': { bgcolor: freq.color, opacity: 0.85 } }}>
          VIEW PROFILE →
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => onConnect(u._id)} disabled={alreadySent}
            sx={{ borderColor: freq.color, color: freq.color, borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.68rem', py: 0.75, letterSpacing: 1, '&:hover': { bgcolor: freq.color + '15' }, '&.Mui-disabled': { opacity: 0.4, borderColor: freq.color, color: freq.color } }}>
            {alreadySent ? 'PINGED ✓' : 'PING'}
          </Button>
          <Button fullWidth variant="outlined" onClick={() => onMessage(u._id)}
            sx={{ borderColor: freq.color, color: freq.color, borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.68rem', py: 0.75, letterSpacing: 1, '&:hover': { bgcolor: freq.color + '15' } }}>
            COMMS
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ── Users-in-radius list ── */
function RadarList({ users, myPos, onSelect, filter, setFilter, onClose }) {
  const filtered = filter.trim()
    ? users.filter(u =>
        u.name?.toLowerCase().includes(filter.toLowerCase()) ||
        u.subjects?.some(s => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : users;

  return (
    <motion.div
      initial={{ x: -340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -340, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        width: 300, zIndex: 20,
        background: 'rgba(2, 6, 23, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRight: `2px solid ${R}`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${R}44` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Users size={14} color={R} />
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: R, fontSize: '0.75rem', letterSpacing: 2 }}>
              IN_RADIUS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ px: 1, bgcolor: R + '22', border: `1px solid ${R}`, fontFamily: 'monospace', fontSize: '0.65rem', color: R, fontWeight: 900 }}>
              {filtered.length}
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
              <X size={14} />
            </IconButton>
          </Box>
        </Box>
        <TextField size="small" placeholder="SCAN QUERY..." value={filter} onChange={e => setFilter(e.target.value)} fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={12} color={R} /></InputAdornment>,
            endAdornment: filter ? <InputAdornment position="end"><IconButton size="small" onClick={() => setFilter('')} sx={{ color: R }}><X size={10} /></IconButton></InputAdornment> : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 0, fontFamily: 'monospace', color: R, bgcolor: 'rgba(16,185,129,0.04)', fontSize: '0.75rem',
              '& fieldset': { borderColor: R2 }, '&:hover fieldset': { borderColor: R }, '&.Mui-focused fieldset': { borderColor: R },
            },
            '& input::placeholder': { color: R2, opacity: 1, fontSize: '0.72rem' },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 2, bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: R + '44' } }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Radar size={32} color={R2} style={{ margin: '0 auto 12px' }} />
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: R2, fontWeight: 900 }}>
              NO_TARGETS_DETECTED
            </Typography>
          </Box>
        ) : (
          filtered.map((u, i) => {
            const freq = FREQ_COLORS[u.studyStyle] || FREQ_COLORS.default;
            const coords = u.geoLocation?.coordinates;
            const dist = coords && myPos
              ? haversineKm(myPos.lat, myPos.lng, coords[1], coords[0]).toFixed(1)
              : null;
            return (
              <Box key={u._id} onClick={() => onSelect(u)}
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                  cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  '&:hover': { bgcolor: freq.color + '0D' },
                  transition: 'background 0.15s',
                }}
              >
                {/* Signal strength bar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, flexShrink: 0 }}>
                  {[...Array(4)].map((_, j) => {
                    const active = dist ? j < Math.max(1, 4 - Math.floor(parseFloat(dist) / 3)) : j < 2;
                    return (
                      <Box key={j} sx={{ width: 3, height: 3 + j * 2, bgcolor: active ? freq.color : 'rgba(255,255,255,0.1)', borderRadius: '1px', boxShadow: active ? `0 0 4px ${freq.color}` : 'none' }} />
                    );
                  })}
                </Box>

                <Avatar src={u.avatar} sx={{ width: 36, height: 36, fontSize: '1rem', border: `1.5px solid ${freq.color}`, bgcolor: freq.color + '22', flexShrink: 0, boxShadow: `0 0 8px ${freq.glow}` }}>
                  {u.name?.[0]}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'white', fontSize: '0.78rem' }}>
                    {u.name?.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: freq.color, boxShadow: `0 0 4px ${freq.color}`, flexShrink: 0 }} />
                    <Typography noWrap sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)' }}>
                      {(u.studyStyle || 'MIXED').toUpperCase()}
                      {dist && ` · ${dist} km`}
                    </Typography>
                  </Box>
                </Box>

                <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
              </Box>
            );
          })
        )}
      </Box>
    </motion.div>
  );
}

/* ══════ MAIN ══════ */
export default function StudyMap() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myPos, setMyPos] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);  // blip clicked → right panel
  const [showList, setShowList] = useState(false);         // left list panel
  const [mapInstance, setMapInstance] = useState(null);
  const [filter, setFilter] = useState('');
  const [sentReqs, setSentReqs] = useState(new Set());
  const [sweepAngle, setSweepAngle] = useState(0);
  const sweepRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: LIBRARIES });

  const onMapLoad = useCallback((map) => { setMapInstance(map); }, []);

  // ── Radar sweep animation (CSS keyframes) ──
  useEffect(() => {
    let frame;
    let angle = 0;
    const spin = () => {
      angle = (angle + 0.5) % 360;
      setSweepAngle(angle);
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Sync sent requests
  useEffect(() => {
    if (user?.sentRequests) setSentReqs(new Set(user.sentRequests.map(r => r._id || r)));
  }, [user]);

  const fetchNearby = useCallback(async (lat, lng, km) => {
    try {
      const { data } = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${km * 1000}`);
      setNearbyUsers(data);
    } catch { toast.error('RADAR ERROR: targets lost'); }
  }, []);

  const initLocation = useCallback(() => {
    setLoading(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError('GEOLOCATION_UNSUPPORTED'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setMyPos({ lat, lng });
        try { await api.put('/users/profile/location', { lat, lng }); } catch { /* silent */ }
        await fetchNearby(lat, lng, radius);
        setLoading(false);
      },
      () => { setLocationError('LOC_ACCESS_DENIED'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [fetchNearby, radius]);

  useEffect(() => { initLocation(); }, [initLocation]);

  const handleRadiusChange = async (_, val) => {
    setRadius(val);
    if (myPos) await fetchNearby(myPos.lat, myPos.lng, val);
  };

  const handleConnect = async (targetId) => {
    try {
      await api.post(`/users/connect/${targetId}`);
      setSentReqs(prev => new Set([...prev, targetId]));
      toast.success('PING_SENT ✓');
    } catch (e) { toast.error(e.response?.data?.message || 'PING_FAIL'); }
  };

  const handleMessage = (targetId) => { navigate('/messages', { state: { openUserId: targetId } }); };
  const handleViewProfile = (targetId) => { navigate(`/profile/${targetId}`); };
  const handleCenterOnMe = () => { if (mapInstance && myPos) { mapInstance.panTo(myPos); mapInstance.setZoom(14); } };

  // When a blip is clicked — open right panel and center map
  const handleBlipClick = (u) => {
    const coords = u.geoLocation?.coordinates;
    if (coords && mapInstance) {
      mapInstance.panTo({ lat: coords[1], lng: coords[0] });
    }
    setSelectedUser(prev => prev?._id === u._id ? null : u);
  };

  const filteredUsers = filter.trim()
    ? nearbyUsers.filter(u =>
        u.name?.toLowerCase().includes(filter.toLowerCase()) ||
        u.subjects?.some(s => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : nearbyUsers;

  // ── Loading ──
  if (!isLoaded || loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: BG }}>
      <Box sx={{ position: 'relative', width: 100, height: 100 }}>
        {/* Animated radar rings */}
        {[100, 70, 40].map((s, i) => (
          <Box key={i} component={motion.div}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            sx={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%',
              border: `1px solid ${R}`, transform: 'translate(-50%, -50%)', boxShadow: `0 0 12px ${R}44` }}
          />
        ))}
        <Box component={motion.div} animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <Radar size={36} color={R} />
        </Box>
      </Box>
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: R, letterSpacing: 3, fontSize: '0.85rem' }}>
        {!isLoaded ? 'INITIALIZING RADAR SYSTEM...' : 'ACQUIRING SATELLITE LOCK...'}
      </Typography>
    </Box>
  );

  if (loadError || !apiKey) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: BG, color: 'error.main' }}>
      <Typography variant="h5" fontWeight={800} fontFamily="monospace">MAP_API_KEY_MISSING</Typography>
    </Box>
  );

  if (locationError) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: BG, color: R }}>
      <Radar size={64} color={R} />
      <Typography variant="h5" fontWeight={800} fontFamily="monospace">{locationError}</Typography>
      <Button variant="outlined" onClick={initLocation} sx={{ color: R, borderColor: R, fontFamily: 'monospace', fontWeight: 900, borderRadius: 0 }}>RETRY LOCK</Button>
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden', bgcolor: BG }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes radarSweep {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes blipPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.4); }
        }
      `}</style>



      {/* ── Grid overlay ── */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)',
        backgroundSize: '50px 50px' }}
      />

      {/* ── Google Map ── */}
      {myPos && (
        <Box sx={{ width: '100%', height: '100%', position: 'absolute', zIndex: 0 }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={myPos} zoom={13} onLoad={onMapLoad}
            options={{ styles: MAP_STYLES, disableDefaultUI: true, clickableIcons: false }}
          >
            {/* ── Radar sweep anchored at user's GPS position via OverlayView ── */}
            <OverlayView
              position={myPos}
              mapPaneName="overlayLayer"
              getPixelPositionOffset={() => ({ x: 0, y: 0 })}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 4000,
                  height: 4000,
                  top: 0,
                  left: 0,
                  /* Center the huge div on the exact pixel of myPos */
                  transform: 'translate(-50%, -50%) rotate(0deg)',
                  animation: 'radarSweep 6s linear infinite',
                  background:
                    'conic-gradient(from 0deg, transparent 60%, rgba(16,185,129,0.03) 75%, rgba(16,185,129,0.20) 100%)',
                  pointerEvents: 'none',
                  borderRadius: '50%',
                  transformOrigin: '50% 50%',
                }}
              />
            </OverlayView>

            {/* ── My position ── */}
            <Marker position={myPos} icon={createBlip(R, true)} zIndex={1000} />

            {/* ── Concentric scan rings centered on me ── */}
            <Circle center={myPos} radius={radius * 1000}
              options={{ fillColor: R, fillOpacity: 0.025, strokeColor: R, strokeOpacity: 0.35, strokeWeight: 1 }} />
            <Circle center={myPos} radius={radius * 500}
              options={{ fillColor: 'transparent', strokeColor: R, strokeOpacity: 0.12, strokeWeight: 1, strokeDashArray: '4' }} />
            <Circle center={myPos} radius={radius * 250}
              options={{ fillColor: 'transparent', strokeColor: R, strokeOpacity: 0.08, strokeWeight: 1 }} />

            {/* ── Nearby user blips ── */}
            {filteredUsers.map(u => {
              const coords = u.geoLocation?.coordinates;
              if (!coords || coords.length < 2) return null;
              const pos = { lat: coords[1], lng: coords[0] };
              const freq = FREQ_COLORS[u.studyStyle] || FREQ_COLORS.default;
              const isSelected = selectedUser?._id === u._id;

              return (
                <React.Fragment key={u._id}>
                  <Marker
                    position={pos}
                    icon={createBlip(freq.color)}
                    onClick={() => handleBlipClick(u)}
                    zIndex={isSelected ? 999 : 10}
                  />
                  {/* Small label on selected blip */}
                  {isSelected && (
                    <InfoWindow position={pos} onCloseClick={() => setSelectedUser(null)}>
                      <Box sx={{ bgcolor: '#020617', border: `1px solid ${freq.color}`, px: 1.5, py: 0.75, minWidth: 120 }}>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: freq.color, fontSize: '0.78rem', letterSpacing: 1 }}>
                          ▸ {u.name?.toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
                          {(u.studyStyle || 'MIXED').toUpperCase()}
                        </Typography>
                      </Box>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </Box>
      )}

      {/* ── Top HUD ── */}
      <Paper elevation={0} sx={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        p: 2, minWidth: 340, maxWidth: 'calc(100vw - 680px)',
        bgcolor: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(16px)',
        border: `1.5px solid ${R}`,
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        display: 'flex', flexDirection: 'column', gap: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${R}33`, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component={motion.div} animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
              <Radar size={16} color={R} />
            </Box>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: R, fontSize: '0.78rem', letterSpacing: 2, textShadow: `0 0 8px ${R}` }}>
              LOCAL_RADAR_SCAN
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Blip count badge — clicking opens list */}
            <Tooltip title="View all targets in radius">
              <Box onClick={() => setShowList(v => !v)} sx={{
                display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.4,
                bgcolor: showList ? R + '22' : 'rgba(245,158,11,0.1)', border: `1px solid ${showList ? R : '#f59e0b'}`,
                cursor: 'pointer', '&:hover': { bgcolor: R + '15' }, transition: '0.2s',
              }}>
                <Users size={12} color={showList ? R : '#f59e0b'} />
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 900, color: showList ? R : '#f59e0b' }}>
                  BLIPS: {filteredUsers.length}
                </Typography>
              </Box>
            </Tooltip>
            <IconButton size="small" onClick={() => myPos && fetchNearby(myPos.lat, myPos.lng, radius)} sx={{ color: R, '&:hover': { bgcolor: R + '22' } }}>
              <RefreshCw size={13} />
            </IconButton>
            <IconButton size="small" onClick={handleCenterOnMe} sx={{ color: R, '&:hover': { bgcolor: R + '22' } }}>
              <Navigation size={13} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: R }}>SCAN_RADIUS</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: '#f59e0b' }}>{radius} KM</Typography>
          </Box>
          <Slider value={radius} min={1} max={50} step={1} onChange={handleRadiusChange}
            sx={{ color: R, height: 2, mt: 0.5,
              '& .MuiSlider-thumb': { width: 12, height: 12, borderRadius: 0, border: `2px solid ${R}`, bgcolor: BG },
              '& .MuiSlider-rail': { bgcolor: R2 },
            }}
          />
        </Box>
      </Paper>

      {/* ── Frequency Legend (bottom right) ── */}
      <AnimatePresence>
        {!selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 10 }}
          >
            <Paper elevation={0} sx={{ p: 1.75, bgcolor: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(12px)', border: `1px solid ${R}`, borderLeft: `3px solid ${R}`, minWidth: 160 }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 900, color: R, mb: 1.25, letterSpacing: 2 }}>
                [ FREQUENCIES ]
              </Typography>
              {Object.entries(FREQ_COLORS).filter(([k]) => k !== 'default').map(([style, { color }]) => {
                const count = nearbyUsers.filter(u => u.studyStyle === style).length;
                return (
                  <Box key={style} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box component={motion.div}
                        animate={{ opacity: [0.5, 1, 0.5], boxShadow: [`0 0 3px ${color}`, `0 0 8px ${color}`, `0 0 3px ${color}`] }}
                        transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
                        sx={{ width: 8, height: 8, bgcolor: color, borderRadius: '50%' }}
                      />
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>
                        {style.slice(0, 12)}
                      </Typography>
                    </Box>
                    {count > 0 && (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color, fontWeight: 900 }}>{count}</Typography>
                    )}
                  </Box>
                );
              })}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left Panel: Users in radius list ── */}
      <AnimatePresence>
        {showList && (
          <RadarList
            users={filteredUsers}
            myPos={myPos}
            onSelect={(u) => { handleBlipClick(u); }}
            filter={filter}
            setFilter={setFilter}
            onClose={() => setShowList(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Right Panel: Selected blip detail ── */}
      <AnimatePresence>
        {selectedUser && selectedUser !== 'me' && (
          <BlipPanel
            user={selectedUser}
            myPos={myPos}
            onClose={() => setSelectedUser(null)}
            onConnect={handleConnect}
            onMessage={handleMessage}
            onViewProfile={handleViewProfile}
            sentReqs={sentReqs}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}
