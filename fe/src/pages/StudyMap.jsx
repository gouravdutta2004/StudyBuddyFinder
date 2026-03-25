import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle
} from '@react-google-maps/api';
import {
  Box, Typography, Avatar, Button, Chip, Slider, Paper,
  CircularProgress, useTheme, Tooltip, IconButton, Badge, TextField,
  InputAdornment
} from '@mui/material';
import {
  MapPin, Users, Navigation, RefreshCw, MessageCircle,
  UserPlus, Search, Layers, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LIBRARIES = ['places'];

const STUDY_STYLE_COLORS = {
  Visual: '#f59e0b',
  Auditory: '#10b981',
  'Reading/Writing': '#3b82f6',
  Kinesthetic: '#ef4444',
  Mixed: '#8b5cf6',
  Pomodoro: '#ec4899',
  default: '#8b5cf6',
};

const MAP_STYLES_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1e40af' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f2c1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

// Custom SVG pin factory for Google Maps — uses google.maps.Size/Point objects
function createGooglePin(color, isMe = false) {
  const w = isMe ? 48 : 38;
  const h = Math.round(w * 1.35);

  const pulseRing = isMe
    ? `<circle cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.4"/>`
    : '';

  const cx = w / 2;
  const cy = w / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.35"/></filter>
      <radialGradient id="g" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${pulseRing}
    <path d="M${cx} 2 C${cx - 14} 2 ${cx - 20} ${cy - 4} ${cx - 20} ${cy}
             c0 ${cy + 4} ${20} ${h - cy - 2} ${20} ${h - cy - 2}
             s${20} ${-(h - cy - 2) + (cy + 4)} ${20} ${-(h - cy - 2) + (cy + 4)}
             C${cx + 20} ${cy - 4} ${cx + 14} 2 ${cx} 2z"
          fill="${color}" filter="url(#s)"/>
    <path d="M${cx} 2 C${cx - 14} 2 ${cx - 20} ${cy - 4} ${cx - 20} ${cy}
             c0 ${cy + 4} ${20} ${h - cy - 2} ${20} ${h - cy - 2}
             s${20} ${-(h - cy - 2) + (cy + 4)} ${20} ${-(h - cy - 2) + (cy + 4)}
             C${cx + 20} ${cy - 4} ${cx + 14} 2 ${cx} 2z"
          fill="url(#g)"/>
    <circle cx="${cx}" cy="${cy}" r="${isMe ? cx - 8 : cx - 10}" fill="white" opacity="0.9"/>
    ${isMe ? `<circle cx="${cx}" cy="${cy}" r="${cx - 16}" fill="${color}"/>` : ''}
  </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(w, h),
    anchor: new window.google.maps.Point(cx, h),
  };
}


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
  const [selectedUser, setSelectedUser] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [filter, setFilter] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const initLocation = useCallback(() => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setMyPos({ lat, lng });
        try {
          await api.put('/users/profile/location', { lat, lng });
        } catch {/*silent*/}
        await fetchNearby(lat, lng, radius);
        setLoading(false);
      },
      () => {
        setLocationError('Location access denied. Please allow location in your browser settings.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius]);

  const fetchNearby = async (lat, lng, km) => {
    try {
      const { data } = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${km * 1000}`);
      setNearbyUsers(data);
    } catch {
      toast.error('Failed to fetch nearby users');
    }
  };

  useEffect(() => { initLocation(); }, []);

  const handleRadiusChange = async (_, val) => {
    setRadius(val);
    if (myPos) await fetchNearby(myPos.lat, myPos.lng, val);
  };

  const handleConnect = async (targetId) => {
    try {
      await api.post(`/users/connect/${targetId}`);
      toast.success('Connection request sent! 🎉');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not send request');
    }
  };

  const handleMessage = (targetId) => {
    navigate('/messages', { state: { openUserId: targetId } });
  };

  const handleCenterOnMe = () => {
    if (mapInstance && myPos) {
      mapInstance.panTo(myPos);
      mapInstance.setZoom(14);
    }
  };

  const filteredUsers = filter.trim()
    ? nearbyUsers.filter(u =>
        u.name?.toLowerCase().includes(filter.toLowerCase()) ||
        u.subjects?.some(s => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : nearbyUsers;

  // ── Loading states ──────────────────────────────────────────────
  if (!isLoaded || loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 3 }}>
        <CircularProgress size={56} sx={{ color: '#6366f1' }} />
        <Typography variant="h6" fontWeight={700} color="text.secondary">
          {!isLoaded ? 'Loading Google Maps…' : 'Locating your study matrix…'}
        </Typography>
      </Box>
    );
  }

  if (loadError || !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 3, p: 4, textAlign: 'center' }}>
        <MapPin size={64} color="#6366f1" />
        <Typography variant="h5" fontWeight={800}>Google Maps API Key Missing</Typography>
        <Typography color="text.secondary" maxWidth={500}>
          Add your key to <code>fe/.env</code>:<br/>
          <code style={{ background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
            VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
          </code>
          <br/><br/>Then restart the Vite dev server.
        </Typography>
        <Button variant="contained" href="https://console.cloud.google.com" target="_blank" sx={{ bgcolor: '#6366f1', borderRadius: 3, fontWeight: 700 }}>
          Get API Key (Free)
        </Button>
      </Box>
    );
  }

  if (locationError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 3, p: 4, textAlign: 'center' }}>
        <Navigation size={64} color="#ef4444" />
        <Typography variant="h5" fontWeight={800}>{locationError}</Typography>
        <Button variant="contained" onClick={initLocation} sx={{ bgcolor: '#6366f1', borderRadius: 3, fontWeight: 700 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

      {/* ── Top Control Panel ── */}
      <Paper elevation={8} sx={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, borderRadius: '20px', p: 2, minWidth: 340, maxWidth: '92vw',
        bgcolor: isDark ? 'rgba(2,6,23,0.92)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 1.5
      }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1}>
            <MapPin size={22} color="#6366f1" /> Nearby Scholars
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Users size={14} />}
              label={`${filteredUsers.length} found`}
              size="small"
              sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 700 }}
            />
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => myPos && fetchNearby(myPos.lat, myPos.lng, radius)}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Centre on me">
              <IconButton size="small" onClick={handleCenterOnMe} sx={{ color: '#6366f1' }}>
                <Navigation size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search filter */}
        <TextField
          size="small"
          placeholder="Filter by name or subject…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>,
            endAdornment: filter ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setFilter('')}><X size={14} /></IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />

        {/* Radius slider */}
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            Radius: <strong>{radius} km</strong>
          </Typography>
          <Slider
            value={radius} min={1} max={50} step={1}
            onChange={handleRadiusChange}
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${v} km`}
            sx={{ color: '#6366f1', '& .MuiSlider-thumb': { width: 16, height: 16 }, mt: 0.5 }}
          />
        </Box>
      </Paper>

      {/* ── Legend (bottom-right) ── */}
      <Paper elevation={4} sx={{
        position: 'absolute', bottom: 24, right: 16, zIndex: 10,
        borderRadius: '16px', p: 2,
        bgcolor: isDark ? 'rgba(2,6,23,0.92)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        minWidth: 150
      }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
          Study Style
        </Typography>
        {Object.entries(STUDY_STYLE_COLORS).filter(([k]) => k !== 'default').map(([style, color]) => (
          <Box key={style} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
            <Typography variant="caption" fontWeight={600}>{style}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#6366f1', flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={700} color="#6366f1">You</Typography>
        </Box>
      </Paper>

      {/* ── Google Map ── */}
      {myPos && (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={myPos}
          zoom={13}
          onLoad={onMapLoad}
          options={{
            styles: isDark ? MAP_STYLES_DARK : [],
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
          }}
        >
          {/* My position marker */}
          <Marker
            position={myPos}
            icon={createGooglePin('#6366f1', true)}
            title={`${user?.name} (You)`}
            onClick={() => setSelectedUser('me')}
            zIndex={1000}
          />

          {/* Radius circle */}
          <Circle
            center={myPos}
            radius={radius * 1000}
            options={{
              fillColor: '#6366f1',
              fillOpacity: 0.05,
              strokeColor: '#6366f1',
              strokeOpacity: 0.4,
              strokeWeight: 1.5,
            }}
          />

          {/* "Me" InfoWindow */}
          {selectedUser === 'me' && (
            <InfoWindow position={myPos} onCloseClick={() => setSelectedUser(null)}>
              <Box sx={{ textAlign: 'center', p: 0.5, minWidth: 140 }}>
                <Avatar src={user?.avatar} sx={{ width: 44, height: 44, mx: 'auto', mb: 1, bgcolor: '#6366f1', fontWeight: 700 }}>
                  {user?.name?.[0]}
                </Avatar>
                <Typography fontWeight={800} fontSize={14}>{user?.name}</Typography>
                <Chip label="You" size="small" sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700, mt: 0.5 }} />
              </Box>
            </InfoWindow>
          )}

          {/* Nearby user markers */}
          {filteredUsers.map(u => {
            const coords = u.geoLocation?.coordinates;
            if (!coords || coords.length < 2) return null;
            const pos = { lat: coords[1], lng: coords[0] };
            const pinColor = STUDY_STYLE_COLORS[u.studyStyle] || STUDY_STYLE_COLORS.default;

            return (
              <React.Fragment key={u._id}>
                <Marker
                  position={pos}
                  icon={createGooglePin(pinColor)}
                  title={u.name}
                  onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                />

                {selectedUser?._id === u._id && (
                  <InfoWindow position={pos} onCloseClick={() => setSelectedUser(null)}>
                    <Box sx={{ minWidth: 220, maxWidth: 260, p: 0.5 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Avatar src={u.avatar} sx={{ width: 50, height: 50, bgcolor: pinColor, fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
                          {u.name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={900} fontSize={15} lineHeight={1.2}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {u.university || 'Independent Scholar'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Stats row */}
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                        <Chip label={`⚡ Lvl ${u.level || 1}`} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700, fontSize: 11 }} />
                        <Chip label={u.studyStyle || 'Mixed'} size="small" sx={{ bgcolor: `${pinColor}20`, color: pinColor, fontWeight: 700, fontSize: 11 }} />
                      </Box>

                      {/* Subjects */}
                      {u.subjects?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                          {u.subjects.slice(0, 4).map(s => (
                            <Chip key={s} label={s} size="small" sx={{ fontSize: 10, fontWeight: 600 }} />
                          ))}
                        </Box>
                      )}

                      {/* CTAs */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth size="small" variant="contained"
                          startIcon={<UserPlus size={13} />}
                          onClick={() => handleConnect(u._id)}
                          sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, fontSize: 12, py: 0.8, '&:hover': { bgcolor: '#4f46e5' } }}
                        >
                          Connect
                        </Button>
                        <Button
                          fullWidth size="small" variant="outlined"
                          startIcon={<MessageCircle size={13} />}
                          onClick={() => handleMessage(u._id)}
                          sx={{ borderColor: '#6366f1', color: '#6366f1', borderRadius: '10px', fontWeight: 700, fontSize: 12, py: 0.8 }}
                        >
                          Message
                        </Button>
                      </Box>
                    </Box>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      )}
    </Box>
  );
}
