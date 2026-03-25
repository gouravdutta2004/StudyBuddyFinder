import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, GraduationCap, BookOpen, MessageCircle, UserPlus, Pencil, UserMinus, Trophy, Flame, Clock, Star, Github, Linkedin, Instagram, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import MindMapModal from '../components/profile/MindMapModal';
import { Container, Card, Box, Avatar, Typography, Button, IconButton, Chip, Grid, LinearProgress, useTheme, CardContent, CircularProgress } from '@mui/material';

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const targetId = id || me?._id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [ratings, setRatings] = useState({ average: 0, count: 0, reviews: [] });
  const [endorsements, setEndorsements] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!targetId) return;
    Promise.all([
      api.get(`/users/${targetId}`),
      api.get(`/ratings/${targetId}`),
      api.get(`/gamification/endorsements/${targetId}`)
    ])
      .then(([profileRes, ratingsRes, endoRes]) => {
        setProfile(profileRes.data);
        setRatings(ratingsRes.data);
        setEndorsements(endoRes.data);
      })
      .catch((err) => {
         console.error(err);
         toast.error('User not found');
      })
      .finally(() => setLoading(false));
  }, [targetId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await api.post(`/users/connect/${id}`);
      toast.success('Connection request sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect?')) return;
    try {
      await api.post(`/users/disconnect/${id}`);
      toast.success('Disconnected successfully');
      window.location.reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to disconnect'); }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!profile) return <Box textAlign="center" py={10} color="text.secondary">User not found</Box>;

  const isConnected = me?.connections?.includes(id);
  const hasSentRequest = me?.sentRequests?.includes(id);

  const calculateCompleteness = (p) => {
    if (!p) return 0;
    const fields = [p.avatar, p.bio, p.subjects?.length > 0, p.university, p.location, p.studyStyle];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };
  const completeness = calculateCompleteness(profile);

  return (
    <Container maxWidth="md" sx={{ py: 4, mb: 10 }}>
      <Card elevation={theme.palette.mode === 'dark' ? 8 : 4} sx={{ borderRadius: 6, overflow: 'visible', position: 'relative' }}>
        {/* Cover Gradient Layer */}
        <Box sx={{ 
          height: { xs: 160, sm: 224 }, 
          background: 'linear-gradient(to right, #2563eb, #4f46e5, #9333ea)', 
          position: 'relative', 
          overflow: 'hidden',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24
        }}>
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', mixBlendMode: 'overlay' }} />
          <Box sx={{ position: 'absolute', bottom: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)' }} />
        </Box>

        {/* Floating Avatar Core */}
        <Avatar 
          src={profile.avatar || undefined} 
          sx={{ 
            width: { xs: 112, sm: 128 }, 
            height: { xs: 112, sm: 128 }, 
            position: 'absolute', 
            top: { xs: 112, sm: 160 }, 
            left: { xs: 24, sm: 40 }, 
            border: `4px solid ${theme.palette.background.paper}`, 
            boxShadow: theme.shadows[10], 
            bgcolor: 'background.paper', 
            color: 'text.disabled',
            zIndex: 10,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.05)' }
          }}
        >
          {!profile.avatar && <User size={48} />}
        </Avatar>

        {/* Informational Matrix */}
        <Box sx={{ px: { xs: 3, sm: 5 }, pt: { xs: 8, sm: 10 }, pb: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 3, mb: 4 }}>
            <Box>
              <Typography variant="h3" fontWeight={900} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {profile.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 1, color: 'text.secondary', fontWeight: 500 }}>
                {profile.university && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GraduationCap size={16} color={theme.palette.primary.main} /> {profile.university}
                  </Typography>
                )}
                {profile.location && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MapPin size={16} color={theme.palette.secondary.main} /> {profile.location}
                  </Typography>
                )}
                {ratings.count > 0 && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ca8a04' }}>
                    <Star size={16} fill="currentColor" /> {ratings.average} ({ratings.count})
                  </Typography>
                )}
              </Box>
              
              {/* Trust Badges */}
              {profile.socialLinks && (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.instagram || profile.isVerified) && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, alignItems: 'center' }}>
                  {profile.isVerified && (
                    <Chip size="small" icon={<BadgeCheck size={14} color="#3b82f6" />} label="Verified Scholar" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 800, borderRadius: 1.5, '& .MuiChip-icon': { color: '#3b82f6' } }} />
                  )}
                  {profile.socialLinks.github && (
                    <IconButton size="small" component="a" href={`https://github/${profile.socialLinks.github}`} target="_blank" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <Github size={18} />
                    </IconButton>
                  )}
                  {profile.socialLinks.linkedin && (
                    <IconButton size="small" component="a" href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} target="_blank" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <Linkedin size={18} color="#0a66c2" />
                    </IconButton>
                  )}
                  {profile.socialLinks.instagram && (
                    <IconButton size="small" component="a" href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <Instagram size={18} color="#e1306c" />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>

            {/* Tactical Engagements */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              <Button 
                variant="outlined" 
                onClick={async () => {
                   const toastId = toast.loading('Generating Secure Academic Resume...');
                   try {
                     const { jsPDF } = await import('jspdf');
                     const doc = new jsPDF();
                     doc.setFont('helvetica', 'bold');
                     doc.setFontSize(22);
                     doc.text(`${profile.name} - Academic Portfolio`, 20, 20);
                     doc.setFontSize(12);
                     doc.setFont('helvetica', 'normal');
                     doc.text(`University: ${profile.university || 'N/A'}`, 20, 35);
                     doc.text(`Location: ${profile.location || 'N/A'}`, 20, 45);
                     doc.text(`Total Study Hours: ${profile.studyHours || 0} hrs`, 20, 55);
                     doc.text(`Current Streak: ${profile.streak || 0} days`, 20, 65);
                     doc.text(`League: ${profile.league || 'BRONZE'}`, 20, 75);
                     doc.text(`Subjects Mastered: ${profile.subjects?.join(', ') || 'None'}`, 20, 85);
                     doc.text(`Cognitive Style: ${profile.studyStyle}`, 20, 95);
                     doc.text(`Badges: ${profile.badges?.join(', ') || 'None'}`, 20, 105);
                     
                     doc.setFont('helvetica', 'italic');
                     doc.text(`"Verified on Study Buddy Finder Framework"`, 20, 280);
                     
                     doc.save(`${profile.name.replace(/\s+/g, '_')}_Academic_Resume.pdf`);
                     toast.success('Resume Decrypted & Exported successfully!', { id: toastId });
                   } catch (err) {
                     toast.error('Failed to generate PDF matrix.', { id: toastId });
                   }
                }}
                sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700, borderColor: 'primary.main', color: 'primary.main' }}
              >
                📥 Export Resume 
              </Button>
              
              {(targetId === me?._id || me?.isAdmin) && (
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(targetId === me?._id ? '/profile/edit' : `/admin/user/${targetId}/edit`)} 
                  startIcon={<Pencil size={16} />}
                  sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700 }}
                >
                  Edit Profile
                </Button>
              )}
              {targetId !== me?._id && (
                <>
                  {isConnected ? (
                    <>
                      <Button 
                        variant="contained" 
                        onClick={() => navigate(`/messages?with=${id}`)} 
                        startIcon={<MessageCircle size={18} />}
                        sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700, background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}
                      >
                        Message
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={handleDisconnect} 
                        startIcon={<UserMinus size={18} />}
                        sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700 }}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : hasSentRequest ? (
                    <Button variant="outlined" disabled sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700 }}>
                      Request Pending
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      onClick={handleConnect} 
                      disabled={connecting} 
                      startIcon={<UserPlus size={18} />}
                      sx={{ flex: { xs: 1, sm: 'none' }, borderRadius: 2, fontWeight: 700, background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}
                    >
                      {connecting ? 'Sending...' : 'Connect'}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Gamification Stats */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: 'background.default' }}>
                <Clock size={24} color={theme.palette.primary.main} style={{ marginBottom: 8 }} />
                <Typography variant="h5" fontWeight={800} color="text.primary">{profile.studyHours || 0}</Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Study Hours</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: 'background.default' }}>
                <Flame size={24} color={theme.palette.warning.main} style={{ marginBottom: 8 }} />
                <Typography variant="h5" fontWeight={800} color="text.primary">{profile.streak || 0}</Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Day Streak</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: 'background.default' }}>
                <Trophy size={24} color="#eab308" style={{ marginBottom: 8 }} />
                <Typography variant="h6" fontWeight={800} color="text.primary" noWrap sx={{ width: '100%' }}>{profile.badges?.length > 0 ? profile.badges.join(', ') : 'Novice Scholar'}</Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Current Rank / Badges</Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Activity Heatmap Widget */}
          <ActivityHeatmap userId={targetId} />

          {/* Profile Completeness for Me */}
          {targetId === me?._id && completeness < 100 && (
            <Card variant="outlined" sx={{ mt: 3, p: 2.5, borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? 'rgba(67, 56, 202, 0.1)' : 'rgba(224, 231, 255, 0.5)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={800} color="primary.main">Profile Completeness</Typography>
                <Typography variant="body2" fontWeight={800} color="primary.main">{completeness}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={completeness} sx={{ height: 10, borderRadius: 5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.1)' }} />
              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                Complete your profile to get better AI match suggestions!
              </Typography>
            </Card>
          )}

          {/* Biological Data */}
          {profile.bio && (
            <Card variant="outlined" sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <Typography variant="overline" fontWeight={800} color="primary.main" display="flex" alignItems="center" gap={1} mb={1}>
                <User size={14} /> About Me
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
                {profile.bio}
              </Typography>
            </Card>
          )}

          {/* Environmental Loadouts */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', p: 3, bgcolor: 'background.paper', '&:hover': { boxShadow: theme.shadows[2] }, transition: 'box-shadow 0.2s' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={800} color="text.primary" display="flex" alignItems="center" gap={1}>
                    <BookOpen size={20} color={theme.palette.secondary.main} /> Academic Mastery
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => setMapOpen(true)} sx={{ borderRadius: '100px', fontWeight: 800 }}>
                    🧠 Neural Map
                  </Button>
                </Box>
                {profile.subjects?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.subjects.map(s => (
                      <Chip key={s} label={s} sx={{ fontWeight: 600, borderRadius: 2 }} color="primary" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled" fontStyle="italic">No subjects added.</Typography>
                )}

                {/* Endorsements System */}
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="text.primary">Endorsements</Typography>
                    {targetId !== me?._id && (
                      <Button onClick={() => {
                        const skill = window.prompt("What subject/skill are you endorsing them for?");
                        if (!skill) return;
                        api.post(`/gamification/endorse/${targetId}`, { skill })
                          .then(res => {
                            toast.success(`Endorsed ${profile.name} for ${skill}!`);
                            setEndorsements([...endorsements, { ...res.data, endorserId: me }]);
                          })
                          .catch(() => toast.error('Failed or already endorsed'));
                      }} size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
                        + Endorse
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {endorsements.length === 0 ? (
                       <Typography variant="caption" color="text.secondary">No endorsements yet.</Typography>
                    ) : (
                      // Group by skill and count
                      Object.entries(endorsements.reduce((acc, current) => {
                        acc[current.skill] = (acc[current.skill] || 0) + 1;
                        return acc;
                      }, {})).map(([skill, count]) => (
                        <Chip key={skill} label={`${skill} ${count > 1 ? `x${count}` : ''}`} sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} size="small" />
                      ))
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', p: 3, bgcolor: 'background.paper', '&:hover': { boxShadow: theme.shadows[2] }, transition: 'box-shadow 0.2s' }}>
                <Typography variant="h6" fontWeight={800} color="text.primary" display="flex" alignItems="center" gap={1} pb={2} mb={2} borderBottom={1} borderColor="divider">
                  <User size={20} color="#10b981" /> Study Info
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">Education Tier</Typography>
                    <Chip label={profile.educationLevel} size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">Cognitive Style</Typography>
                    <Chip label={profile.studyStyle} size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">Session Pref</Typography>
                    <Chip label={profile.preferOnline ? 'Digital Online' : 'Physical Local'} size="small" color="info" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">Network Conn.</Typography>
                    <Chip label={`${profile.connections?.length || 0} Synapses`} size="small" color="success" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

        </Box>
      </Card>
      
      {/* Mind Map Dialog */}
      <MindMapModal open={mapOpen} onClose={() => setMapOpen(false)} user={profile} />
    </Container>
  );
}
