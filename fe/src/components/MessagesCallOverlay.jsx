import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Avatar, Button, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MessagesCallOverlay({ socket, user, activeUser }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Call Status: 'idle' | 'calling' | 'receiving' | 'connected'
  const [callStatus, setCallStatus] = useState('idle');
  const [isVideo, setIsVideo] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [incomingData, setIncomingData] = useState(null); // { callerInfo: {}, signal: {}, isVideo }

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Setup WebRTC and Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', async (data) => {
      // data: { signal, from, callerInfo, isVideo }
      setIncomingData(data);
      setCallStatus('receiving');
    });

    socket.on('call_accepted', async (signal) => {
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          setCallStatus('connected');
        } catch (e) {
          console.error("Set remote description error", e);
        }
      }
    });

    socket.on('call_rejected', () => {
      toast.error('Call declined');
      cleanupCall();
    });

    socket.on('call_ended', () => {
      toast('Call ended', { icon: '📞' });
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      cleanupCall();
    };
  }, [socket]);

  // Handle local video playback
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callStatus, isVideo]);

  // Global methods to trigger from parent component (Messages.jsx) via window event
  useEffect(() => {
    const handleInitiateCall = (e) => {
      const { withVideo, targetUser } = e.detail;
      startCall(targetUser, withVideo);
    };
    window.addEventListener('initiate_webrtc_call', handleInitiateCall);
    return () => window.removeEventListener('initiate_webrtc_call', handleInitiateCall);
  }, [activeUser, socket]);

  const getMedia = async (video) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      toast.error('Permissions denied for camera/microphone');
      return null;
    }
  };

  const createPeer = (targetUserId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }]
    });
    
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        // Technically we should send ICE candidates separately, but for simplicity
        // in this one-shot setup without trickling we wait for ice gathering state complete or use SDP.
        // For a robust implementation we usually emit them immediately.
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return peer;
  };

  const startCall = async (targetUser, video) => {
    if (!targetUser) return toast.error('No active chat selected');
    setCallStatus('calling');
    setIsVideo(video);
    
    const stream = await getMedia(video);
    if (!stream) { setCallStatus('idle'); return; }

    const peer = createPeer(targetUser._id, stream);
    peerRef.current = peer;

    // We send offer once ICE gathering is complete for simplicity (No trickle ICE)
    peer.onicecandidate = (event) => {
      if (!event.candidate) { 
        socket.emit('call_user', {
          userToCall: targetUser._id,
          signalData: peer.localDescription,
          from: socket.id,
          callerInfo: user,
          isVideo: video
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
  };

  const acceptCall = async () => {
    const stream = await getMedia(incomingData.isVideo);
    if (!stream) return;
    setIsVideo(incomingData.isVideo);
    
    const peer = createPeer(incomingData.from, stream); // we don't use 'from' for ID here actually
    peerRef.current = peer;

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        socket.emit('answer_call', {
          to: incomingData.from,
          signal: peer.localDescription
        });
      }
    };

    await peer.setRemoteDescription(new RTCSessionDescription(incomingData.signal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    setCallStatus('connected');
  };

  const rejectCall = () => {
    socket.emit('reject_call', { to: incomingData.from });
    setCallStatus('idle');
    setIncomingData(null);
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setCallStatus('idle');
    setIncomingData(null);
    setIsVideo(false);
    setIsMicMuted(false);
    setIsCamOff(false);
  };

  const endCall = () => {
    socket.emit('end_call', { to: callStatus === 'receiving' || callStatus === 'connected' ? incomingData?.from : activeUser?._id });
    cleanupCall();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  // ── Render ──
  if (callStatus === 'idle') return null;

  return (
    <AnimatePresence>
      <Box component={motion.div} 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        sx={{
          position: 'absolute', inset: 0, zIndex: 9999,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}
      >

        {/* Remote Video Background (if connected and isVideo) */}
        {callStatus === 'connected' && isVideo && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%)' }} />
          </Box>
        )}

        {/* Content Box */}
        <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          
          {callStatus !== 'connected' && (
            <>
              <Avatar 
                src={callStatus === 'receiving' ? incomingData?.callerInfo?.avatar : activeUser?.avatar} 
                sx={{ width: 120, height: 120, bgcolor: '#6366f1', fontSize: '3rem', mb: 2, boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
              >
                {callStatus === 'receiving' ? incomingData?.callerInfo?.name?.[0] : activeUser?.name?.[0]}
              </Avatar>

              <Typography variant="h5" fontWeight={800} color={isVideo || isDark ? 'white' : 'black'}>
                {callStatus === 'receiving' ? incomingData?.callerInfo?.name : activeUser?.name}
              </Typography>
              
              <Typography color={isVideo || isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>
                {callStatus === 'calling' ? 'Calling...' : 
                 callStatus === 'receiving' ? `Incoming ${incomingData?.isVideo ? 'Video' : 'Audio'} Call` : ''}
              </Typography>
            </>
          )}

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 3, mt: callStatus === 'connected' ? 'auto' : 4, pb: callStatus === 'connected' ? 8 : 0 }}>
            
            {callStatus === 'receiving' && (
              <IconButton onClick={acceptCall} sx={{ width: 64, height: 64, bgcolor: '#22c55e', color: 'white', '&:hover': { bgcolor: '#16a34a' }, boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}>
                {incomingData?.isVideo ? <Video size={28} /> : <Phone size={28} />}
              </IconButton>
            )}

            {(callStatus === 'connected' || callStatus === 'calling') && (
              <>
                <IconButton onClick={toggleMic} sx={{ width: 56, height: 56, bgcolor: isMicMuted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: isMicMuted ? '#ef4444' : 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </IconButton>
                {isVideo && (
                  <IconButton onClick={toggleVideo} sx={{ width: 56, height: 56, bgcolor: isCamOff ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: isCamOff ? '#ef4444' : 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                    {isCamOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </IconButton>
                )}
              </>
            )}

            <IconButton onClick={callStatus === 'receiving' ? rejectCall : endCall} sx={{ width: 64, height: 64, bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
              <PhoneOff size={28} />
            </IconButton>
          </Box>
        </Box>

        {/* Local Mini Video (if connected & video) */}
        {callStatus === 'connected' && isVideo && (
          <Box sx={{
            position: 'absolute', bottom: 24, right: 24, width: 140, height: 200, zIndex: 20,
            borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', bgcolor: '#000'
          }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        )}

      </Box>
    </AnimatePresence>
  );
}
