import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff } from 'lucide-react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';

export default function VideoRoom({ roomId, socket, onTogglePanel, showPanel }) {
  const theme = useTheme();
  const localVideoRef = useRef();
  const remoteVideoesRef = useRef({});
  const peerConnections = useRef({});
  
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    // 1. Get local media
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
      },
    })
      .then((currentStream) => {
        setStream(currentStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = currentStream;

        // Signal that WE are ready to receive connections securely
        socket.emit('ready_for_webrtc', { roomId });

        const onUserReady = (socketId) => {
          const peer = createPeer(socketId, socket.id, currentStream);
          peerConnections.current[socketId] = peer;
          setPeers(prev => [...prev, socketId]);
        };

        const onWebrtcSignal = ({ signal, from }) => {
          let peer = peerConnections.current[from];
          if (!peer) {
            peer = addPeer(signal, from, currentStream);
            peerConnections.current[from] = peer;
            setPeers(prev => [...prev, from]);
          } else {
            if (signal.type) peer.setRemoteDescription(new RTCSessionDescription(signal));
            else if (signal.candidate) peer.addIceCandidate(new RTCIceCandidate(signal));
          }
        };

        socket.on('user_ready_for_webrtc', onUserReady);
        socket.on('webrtc_signal', onWebrtcSignal);

        return () => {
          socket.off('user_ready_for_webrtc', onUserReady);
          socket.off('webrtc_signal', onWebrtcSignal);
        };
      })
      .catch((err) => {
        console.error("Local stream error", err);
      });

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId, socket]);

  function createPeer(userToSignal, callerID, currentStream) {
    const peer = new RTCPeerConnection(iceServers);
    currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));
    peer.onicecandidate = (e) => {
      if (e.candidate && socket) socket.emit('webrtc_signal', { to: userToSignal, signal: e.candidate });
    };
    peer.ontrack = (e) => {
       const remoteStream = e.streams[0];
       if (remoteVideoesRef.current[userToSignal]) remoteVideoesRef.current[userToSignal].srcObject = remoteStream;
    };
    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      if (socket) socket.emit('webrtc_signal', { to: userToSignal, signal: offer });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, currentStream) {
    const peer = new RTCPeerConnection(iceServers);
    currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));
    peer.onicecandidate = (e) => {
      if (e.candidate && socket) socket.emit('webrtc_signal', { to: callerID, signal: e.candidate });
    };
    peer.ontrack = (e) => {
       const remoteStream = e.streams[0];
       if (remoteVideoesRef.current[callerID]) remoteVideoesRef.current[callerID].srcObject = remoteStream;
    };
    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(() => peer.createAnswer()).then(answer => {
      peer.setLocalDescription(answer);
      if (socket) socket.emit('webrtc_signal', { to: callerID, signal: answer });
    });
    return peer;
  }

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, pointerEvents: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        overflowX: 'auto', 
        maxWidth: '100%', 
        pb: 1, 
        px: 2,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 10 }
      }}>
        {/* Local Video */}
        <Box sx={{ position: 'relative', width: { xs: 120, md: 160 }, height: { xs: 90, md: 120 }, flexShrink: 0, bgcolor: '#111', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <video playsInline muted ref={localVideoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          <Box sx={{ position: 'absolute', bottom: 6, left: 6, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', px: 1, py: 0.25, borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={600} fontSize="0.7rem">You</Typography>
          </Box>
          {!videoOn && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <VideoOff size={24} color="rgba(255,255,255,0.5)" />
            </Box>
          )}
        </Box>

        {/* Remote Videos */}
        {peers.map((peerId) => (
          <Box key={peerId} sx={{ position: 'relative', width: { xs: 120, md: 160 }, height: { xs: 90, md: 120 }, flexShrink: 0, bgcolor: '#111', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Phase 1 FIX: autoPlay + playsInline, NO muted on remote video */}
            <video playsInline autoPlay ref={el => { if(el) remoteVideoesRef.current[peerId] = el; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', bottom: 6, left: 6, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', px: 1, py: 0.25, borderRadius: 1 }}>
               <Typography variant="caption" fontWeight={600} fontSize="0.7rem">Peer</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Control Dock */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: 'rgba(20,20,20,0.7)', backdropFilter: 'blur(16px)', p: 1, borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <IconButton onClick={toggleMic} sx={{ bgcolor: micOn ? 'rgba(255,255,255,0.15)' : '#ef4444', color: 'white', '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.25)' : '#dc2626' } }}><Mic size={20} /></IconButton>
        <IconButton onClick={toggleVideo} sx={{ bgcolor: videoOn ? 'rgba(255,255,255,0.15)' : '#ef4444', color: 'white', '&:hover': { bgcolor: videoOn ? 'rgba(255,255,255,0.25)' : '#dc2626' } }}><Video size={20} /></IconButton>
        <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />
        <IconButton onClick={onTogglePanel} sx={{ color: 'white', bgcolor: showPanel ? 'rgba(59,130,246,0.3)' : 'transparent', '&:hover': { bgcolor: 'rgba(59,130,246,0.4)' } }}><MessageSquare size={20} /></IconButton>
        <IconButton onClick={() => window.location.href='/sessions'} sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, ml: 1, px: 3, borderRadius: 20 }}><PhoneOff size={18} style={{ marginRight: 6 }} /> Leave</IconButton>
      </Box>
    </Box>
  );
}
