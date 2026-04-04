import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, IconButton, Avatar, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, WifiOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

export default function MessagesCallOverlay({ socket, user, activeUser }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'receiving' | 'connected' | 'unavailable'
  const [isVideo, setIsVideo] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [incomingData, setIncomingData] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // ── Refs (safe to read inside async WebRTC callbacks — no stale closure) ──
  const isVideoRef = useRef(false);          // mirrors isVideo state
  const remoteTargetRef = useRef(null);      // who we are calling / who called us (socket id or userId)
  const remoteStreamRef = useRef(null);      // stores the remote stream in case video el isn't mounted yet

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);       // for video calls
  const remoteAudioRef = useRef(null);       // for audio-only calls
  const ackTimeoutRef = useRef(null);
  const durationTimerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingDataRef = useRef(null);      // mirrors incomingData state (for use in async callbacks)

  // Keep refs in sync with state
  useEffect(() => { isVideoRef.current = isVideo; }, [isVideo]);
  useEffect(() => { incomingDataRef.current = incomingData; }, [incomingData]);

  // ── When remote video element mounts (after callStatus='connected'), attach stored stream ──
  useEffect(() => {
    if (callStatus === 'connected' && remoteStreamRef.current) {
      if (isVideo && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {}); // force play in case autoplay was blocked
      }
      if (!isVideo && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [callStatus, isVideo]);

  // ── Sync local video element ──
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callStatus, isVideo]);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;

    const onCallAck = () => {
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
        ackTimeoutRef.current = null;
      }
    };

    const onIncomingCall = (data) => {
      // data: { signal, from (caller socket.id), callerInfo, isVideo }
      setIncomingData(data);
      incomingDataRef.current = data;
      remoteTargetRef.current = data.from; // store caller's socket.id for ICE
      setCallStatus('receiving');
      socket.emit('call_ack', { to: data.from });
    };

    const onCallAccepted = async (signal) => {
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          // Drain buffered ICE candidates
          for (const c of pendingCandidatesRef.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          pendingCandidatesRef.current = [];
          setCallStatus('connected');
          startDurationTimer();
        } catch (e) {
          console.error('setRemoteDescription error:', e);
          toast.error('Failed to establish call connection');
          cleanupCall();
        }
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate || !peerRef.current) return;
      if (peerRef.current.remoteDescription) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const onCallRejected = () => {
      toast.error('Call declined');
      cleanupCall();
    };

    const onCallEnded = () => {
      toast('Call ended', { icon: '📞' });
      cleanupCall();
    };

    const onCallUnavailable = () => {
      setCallStatus('unavailable');
      cleanupCall(false);
      setTimeout(() => setCallStatus('idle'), 3000);
    };

    socket.on('call_ack', onCallAck);
    socket.on('incoming_call', onIncomingCall);
    socket.on('call_accepted', onCallAccepted);
    socket.on('ice_candidate', onIceCandidate);
    socket.on('call_rejected', onCallRejected);
    socket.on('call_ended', onCallEnded);
    socket.on('call_unavailable', onCallUnavailable);

    return () => {
      socket.off('call_ack', onCallAck);
      socket.off('incoming_call', onIncomingCall);
      socket.off('call_accepted', onCallAccepted);
      socket.off('ice_candidate', onIceCandidate);
      socket.off('call_rejected', onCallRejected);
      socket.off('call_ended', onCallEnded);
      socket.off('call_unavailable', onCallUnavailable);
      cleanupCall();
    };
  }, [socket]);

  // Global event trigger from Messages.jsx
  useEffect(() => {
    const handleInitiateCall = (e) => {
      const { withVideo, targetUser } = e.detail;
      startCall(targetUser, withVideo);
    };
    window.addEventListener('initiate_webrtc_call', handleInitiateCall);
    return () => window.removeEventListener('initiate_webrtc_call', handleInitiateCall);
  }, [activeUser, socket]);

  // Duration timer
  const startDurationTimer = () => {
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  };
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getMedia = async (video) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow permissions in your browser.');
      } else {
        toast.error(`Media error: ${err.message}`);
      }
      return null;
    }
  };

  /**
   * VIDEO BUG FIX: createPeer now accepts explicit `videoMode` boolean
   * and `targetSocketId` — both passed directly, NOT read from stale React state/closure.
   * The `ontrack` handler uses refs (isVideoRef, remoteStreamRef) so it always
   * has the latest values even after async state updates.
   */
  const createPeer = (stream, videoMode, targetSocketId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    // Trickle ICE — uses the passed targetSocketId directly (no stale closure)
    peer.onicecandidate = (event) => {
      if (event.candidate && socket && targetSocketId) {
        socket.emit('ice_candidate', { to: targetSocketId, candidate: event.candidate });
      }
    };

    // VIDEO BUG FIX: Use isVideoRef (always current) + store stream in ref
    // so the useEffect above can apply it once the video element mounts
    peer.ontrack = (event) => {
      const remoteStream = event.streams?.[0] || event.track && new MediaStream([event.track]);
      if (!remoteStream) return;

      // Always store the stream — the useEffect will pick it up once the element exists
      remoteStreamRef.current = remoteStream;

      // Try to apply immediately if element already exists
      if (isVideoRef.current && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      } else if (!isVideoRef.current && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setCallStatus('connected');
        startDurationTimer();
      }
      if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
        toast('Connection lost', { icon: '⚠️' });
        cleanupCall();
      }
    };

    return peer;
  };

  const startCall = async (targetUser, video) => {
    if (!targetUser) return toast.error('No active chat selected');
    if (!socket) return toast.error('Not connected to server');

    setCallStatus('calling');
    setIsVideo(video);
    isVideoRef.current = video; // sync ref immediately (don't wait for useEffect)

    const stream = await getMedia(video);
    if (!stream) { setCallStatus('idle'); return; }

    // VIDEO BUG FIX: remoteTarget for ICE is the USER ID (they join socket room with their userId)
    remoteTargetRef.current = targetUser._id;

    const peer = createPeer(stream, video, targetUser._id);
    peerRef.current = peer;

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: video,
    });
    await peer.setLocalDescription(offer);

    socket.emit('call_user', {
      userToCall: targetUser._id,
      signalData: offer,
      from: socket.id, // our socket.id so receiver can target ICE back to us
      callerInfo: { _id: user._id, name: user.name, avatar: user.avatar },
      isVideo: video,
    });

    // 5-second ACK timeout → show unavailable
    ackTimeoutRef.current = setTimeout(() => {
      socket.emit('cancel_call', { userToCall: targetUser._id });
      setCallStatus('unavailable');
      cleanupCall(false);
      setTimeout(() => setCallStatus('idle'), 3000);
    }, 5000);
  };

  const acceptCall = async () => {
    const data = incomingDataRef.current;
    if (!data) return;

    const video = data.isVideo;
    setIsVideo(video);
    isVideoRef.current = video; // sync ref immediately

    const stream = await getMedia(video);
    if (!stream) return;

    // VIDEO BUG FIX: ICE goes back to caller's socket.id (data.from)
    remoteTargetRef.current = data.from;
    const peer = createPeer(stream, video, data.from);
    peerRef.current = peer;

    try {
      await peer.setRemoteDescription(new RTCSessionDescription(data.signal));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('answer_call', { to: data.from, signal: answer });
      setCallStatus('connected');
      startDurationTimer();
    } catch (e) {
      console.error('acceptCall error:', e);
      toast.error('Failed to connect');
      cleanupCall();
    }
  };

  const rejectCall = () => {
    const data = incomingDataRef.current;
    if (data) socket.emit('reject_call', { to: data.from });
    setCallStatus('idle');
    setIncomingData(null);
  };

  const cleanupCall = useCallback((resetToIdle = true) => {
    if (ackTimeoutRef.current) { clearTimeout(ackTimeoutRef.current); ackTimeoutRef.current = null; }
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    pendingCandidatesRef.current = [];
    remoteStreamRef.current = null;
    remoteTargetRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (resetToIdle) {
      setCallStatus('idle');
      setIncomingData(null);
      incomingDataRef.current = null;
      setIsVideo(false);
      isVideoRef.current = false;
      setIsMicMuted(false);
      setIsCamOff(false);
      setCallDuration(0);
    }
  }, []);

  const endCall = () => {
    const target = remoteTargetRef.current;
    if (target) socket.emit('end_call', { to: target });
    cleanupCall();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicMuted(!track.enabled); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled); }
  };

  // ─── Do not render overlay when idle ───
  if (callStatus === 'idle') {
    // Still need the audio element mounted at all times so ref is always valid
    return <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />;
  }

  const displayName = callStatus === 'receiving' ? incomingData?.callerInfo?.name : activeUser?.name;
  const displayAvatar = callStatus === 'receiving' ? incomingData?.callerInfo?.avatar : activeUser?.avatar;

  return (
    <>
      {/* Audio element — always mounted, never muted (remote audio) */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <AnimatePresence>
        <Box
          component={motion.div}
          key="call-overlay"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          sx={{
            position: 'fixed', inset: 0, zIndex: 9999,
            bgcolor: isDark ? 'rgba(8, 12, 30, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(24px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Remote Video Background — always rendered so ref is attached
              VIDEO BUG FIX: display:none when not needed, so the ref is always valid
              and ontrack can set srcObject before callStatus becomes 'connected' */}
          <Box sx={{
            position: 'absolute', inset: 0, zIndex: 0,
            display: (callStatus === 'connected' && isVideo) ? 'block' : 'none',
          }}>
            {/* NO muted attr — this is the remote person's video/audio */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%)' }} />
          </Box>

          {/* User Unavailable UI */}
          {callStatus === 'unavailable' && (
            <Box sx={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <WifiOff size={36} color="#ef4444" />
              </Box>
              <Typography fontWeight={800} fontSize="1.3rem" color="white" mb={1}>
                User Unavailable
              </Typography>
              <Typography color="rgba(255,255,255,0.5)" fontSize="0.88rem">
                {displayName} couldn't be reached. Try again later.
              </Typography>
            </Box>
          )}

          {/* Main Call UI */}
          {callStatus !== 'unavailable' && (
            <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>

              {/* Avatar + Name (pre-connect) */}
              {callStatus !== 'connected' && (
                <>
                  <Box sx={{ position: 'relative' }}>
                    {/* Pulsing ring animation */}
                    {[1, 2, 3].map(i => (
                      <Box key={i} component={motion.div}
                        animate={{ scale: [1, 1.4 + i * 0.15], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                        sx={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          border: `2px solid ${callStatus === 'receiving' ? '#22c55e' : '#6366f1'}`,
                        }}
                      />
                    ))}
                    <Avatar src={displayAvatar} sx={{
                      width: 120, height: 120,
                      bgcolor: callStatus === 'receiving' ? '#22c55e' : '#6366f1',
                      fontSize: '3rem',
                      boxShadow: `0 8px 32px ${callStatus === 'receiving' ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.4)'}`,
                    }}>
                      {displayName?.[0]}
                    </Avatar>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="white" mb={0.5}>
                      {displayName}
                    </Typography>
                    <Typography color="rgba(255,255,255,0.5)" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                      {callStatus === 'calling'
                        ? `Calling via ${isVideo ? 'Video' : 'Audio'}…`
                        : `Incoming ${incomingData?.isVideo ? 'Video' : 'Audio'} Call`}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Call duration (connected) */}
              {callStatus === 'connected' && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography fontWeight={800} color="white" fontSize="1.5rem">{displayName}</Typography>
                  <Typography color="rgba(255,255,255,0.6)" fontSize="0.85rem" fontFamily="monospace">
                    {formatDuration(callDuration)}
                  </Typography>
                </Box>
              )}

              {/* Controls */}
              <Box sx={{
                display: 'flex', gap: 2.5,
                mt: callStatus === 'connected' ? 'auto' : 3,
                pb: callStatus === 'connected' ? 8 : 0,
              }}>
                {/* Accept (receiver only) */}
                {callStatus === 'receiving' && (
                  <IconButton onClick={acceptCall} component={motion.button}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    sx={{ width: 68, height: 68, bgcolor: '#22c55e', color: 'white', '&:hover': { bgcolor: '#16a34a' }, boxShadow: '0 4px 20px rgba(34,197,94,0.5)' }}>
                    {incomingData?.isVideo ? <Video size={30} /> : <Phone size={30} />}
                  </IconButton>
                )}

                {/* Mic + Cam (in-call) */}
                {(callStatus === 'connected' || callStatus === 'calling') && (
                  <>
                    <IconButton onClick={toggleMic} sx={{
                      width: 56, height: 56,
                      bgcolor: isMicMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${isMicMuted ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`,
                      color: isMicMuted ? '#f87171' : 'white',
                      '&:hover': { bgcolor: isMicMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)' },
                    }}>
                      {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </IconButton>

                    {isVideo && (
                      <IconButton onClick={toggleVideo} sx={{
                        width: 56, height: 56,
                        bgcolor: isCamOff ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                        border: `1px solid ${isCamOff ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`,
                        color: isCamOff ? '#f87171' : 'white',
                        '&:hover': { bgcolor: isCamOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)' },
                      }}>
                        {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                      </IconButton>
                    )}
                  </>
                )}

                {/* End / Reject */}
                <IconButton
                  onClick={callStatus === 'receiving' ? rejectCall : endCall}
                  component={motion.button}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  sx={{ width: 68, height: 68, bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, boxShadow: '0 4px 20px rgba(239,68,68,0.5)' }}>
                  <PhoneOff size={30} />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Local PiP (video calls only) — muted because it's YOUR own feed */}
          <Box sx={{
            position: 'absolute', bottom: 24, right: 24,
            width: 140, height: 200, zIndex: 20,
            borderRadius: '16px', overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            bgcolor: '#000',
            display: (callStatus === 'connected' && isVideo) ? 'block' : 'none',
          }}>
            {/* muted = correct, this is YOUR camera feed */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </Box>
        </Box>
      </AnimatePresence>
    </>
  );
}
