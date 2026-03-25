import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box, Typography, Avatar, Button, Chip, Slider, Paper,
  CircularProgress, useTheme, Tooltip, IconButton
} from '@mui/material';
import { MapPin, Users, Navigation, RefreshCw, MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Fix default leaflet marker icon missing in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom coloured icon factory
const createColorIcon = (color = '#6366f1', isMe = false) => {
  const size = isMe ? 40 : 32;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${Math.round(size * 1.33)}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="12" cy="8" r="4" fill="white" opacity="0.9"/>
      ${isMe ? '<circle cx="12" cy="8" r="2" fill="' + color + '"/>' : ''}
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [size, Math.round(size * 1.33)],
    iconAnchor: [size / 2, Math.round(size * 1.33)],
    popupAnchor: [0, -Math.round(size * 1.33)],
  });
};

// Smoothly fly to user position when it changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center]);
  return null;
}

const STUDY_STYLE_COLORS = {
  Visual: '#f59e0b',
  Auditory: '#10b981',
  'Reading/Writing': '#3b82f6',
  Kinesthetic: '#ef4444',
  Mixed: '#8b5cf6',
  Pomodoro: '#ec4899',
};

export default function StudyMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [myPos, setMyPos] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [radius, setRadius] = useState(10); // km
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const watchRef = useRef(null);

  // Ask for geolocation, save to backend, fetch nearby
  const initLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    watchRef.current = navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMyPos([lat, lng]);

        // Persist user's position to backend
        try {
          await api.put('/users/profile/location', { lat, lng });
        } catch (e) { /* silent */ }

        await fetchNearby(lat, lng, radius);
        setLoading(false);
      },
      (err) => {
        setLocationError('Location access denied. Please allow location in browser settings.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchNearby = async (lat, lng, km) => {
    try {
      const res = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${km * 1000}`);
      setNearbyUsers(res.data);
    } catch (e) {
      toast.error('Failed to fetch nearby users');
    }
  };

  useEffect(() => {
    initLocation();
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  const handleRadiusChange = async (_, newVal) => {
    setRadius(newVal);
    if (myPos) await fetchNearby(myPos[0], myPos[1], newVal);
  };

  const handleConnect = async (targetId) => {
    try {
      await api.post(`/users/connect/${targetId}`);
      toast.success('Connection request sent!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send request');
    }
  };

  const handleMessage = (targetId) => {
    navigate('/messages', { state: { openUserId: targetId } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 3 }}>
        <CircularProgress size={56} sx={{ color: '#6366f1' }} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">
          Locating your study matrix…
        </Typography>
      </Box>
    );
  }

  if (locationError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 3, p: 4 }}>
        <Navigation size={56} color="#ef4444" />
        <Typography variant="h5" fontWeight={800} textAlign="center">{locationError}</Typography>
        <Button variant="contained" onClick={initLocation} sx={{ bgcolor: '#6366f1', borderRadius: 3, fontWeight: 700, px: 4 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

      {/* Controls Panel */}
      <Paper elevation={8} sx={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, borderRadius: '20px', p: 2.5, minWidth: 320, maxWidth: '90vw',
        bgcolor: isDark ? 'rgba(2,6,23,0.92)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        display: 'flex', flexDirection: 'column', gap: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1}>
            <MapPin size={22} color="#6366f1" /> Nearby Scholars
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Users size={14} />}
              label={`${nearbyUsers.length} found`}
              size="small"
              sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700 }}
            />
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => myPos && fetchNearby(myPos[0], myPos[1], radius)}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ px: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom>
            Search Radius: {radius} km
          </Typography>
          <Slider
            value={radius}
            min={1}
            max={50}
            step={1}
            onChange={handleRadiusChange}
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${v} km`}
            sx={{ color: '#6366f1', '& .MuiSlider-thumb': { width: 18, height: 18 } }}
          />
        </Box>
      </Paper>

      {/* Legend */}
      <Paper elevation={4} sx={{
        position: 'absolute', bottom: 24, right: 16, zIndex: 1000,
        borderRadius: '16px', p: 2, bgcolor: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        maxWidth: 180
      }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Study Style
        </Typography>
        {Object.entries(STUDY_STYLE_COLORS).map(([style, color]) => (
          <Box key={style} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
            <Typography variant="caption" fontWeight={600}>{style}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#6366f1', flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={700} color="#6366f1">You</Typography>
        </Box>
      </Paper>

      {/* The Map */}
      {myPos && (
        <MapContainer
          center={myPos}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={isDark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
          <MapController center={myPos} />

          {/* Radius circle */}
          <Circle
            center={myPos}
            radius={radius * 1000}
            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }}
          />

          {/* My marker */}
          <Marker position={myPos} icon={createColorIcon('#6366f1', true)}>
            <Popup>
              <Box sx={{ textAlign: 'center', p: 1, minWidth: 160 }}>
                <Avatar src={user?.avatar} sx={{ width: 48, height: 48, mx: 'auto', mb: 1, bgcolor: '#6366f1' }}>
                  {user?.name?.[0]}
                </Avatar>
                <Typography fontWeight={800}>{user?.name}</Typography>
                <Chip label="You" size="small" sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700, mt: 0.5 }} />
              </Box>
            </Popup>
          </Marker>

          {/* Nearby user markers */}
          {nearbyUsers.map(u => {
            const pinColor = STUDY_STYLE_COLORS[u.studyStyle] || '#8b5cf6';
            const coords = u.geoLocation?.coordinates;
            if (!coords || coords.length < 2) return null;
            const pos = [coords[1], coords[0]]; // Leaflet is [lat, lng], MongoDB is [lng, lat]

            return (
              <Marker key={u._id} position={pos} icon={createColorIcon(pinColor)}>
                <Popup minWidth={220}>
                  <Box sx={{ p: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar src={u.avatar} sx={{ width: 48, height: 48, bgcolor: pinColor, fontWeight: 700, fontSize: 20 }}>
                        {u.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={800} fontSize={15}>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.university || 'Independent Scholar'}</Typography>
                      </Box>
                    </Box>

                    {u.subjects?.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                        {u.subjects.slice(0, 3).map(s => (
                          <Chip key={s} label={s} size="small" sx={{ fontSize: 11, fontWeight: 600 }} />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip label={`Lvl ${u.level || 1}`} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700 }} />
                      <Chip label={u.studyStyle || 'Mixed'} size="small" sx={{ bgcolor: `${pinColor}20`, color: pinColor, fontWeight: 700 }} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth size="small" variant="contained"
                        startIcon={<UserPlus size={14} />}
                        onClick={() => handleConnect(u._id)}
                        sx={{ bgcolor: '#6366f1', borderRadius: 2, fontWeight: 700, fontSize: 12, '&:hover': { bgcolor: '#4f46e5' } }}
                      >
                        Connect
                      </Button>
                      <Button
                        fullWidth size="small" variant="outlined"
                        startIcon={<MessageCircle size={14} />}
                        onClick={() => handleMessage(u._id)}
                        sx={{ borderColor: '#6366f1', color: '#6366f1', borderRadius: 2, fontWeight: 700, fontSize: 12 }}
                      >
                        Message
                      </Button>
                    </Box>
                  </Box>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </Box>
  );
}
