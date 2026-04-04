import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  notifyGeneral,
  notifyNewMessage,
  notifyQuestCompleted,
  notifySOSIncoming,
  notifySOSNoExperts,
  notifySOSBroadcast,
  notifySOSAccepted,
  notifySOSError,
  notifySuccess,
  notifyError,
} from '../components/ui/PremiumToast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); setSocket(null); }
      return;
    }

    const SERVER = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(SERVER, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    // ── Join personal notification room ──
    newSocket.emit('setup', user._id);
    newSocket.on('connect', () => { newSocket.emit('setup', user._id); });

    // ── 1. General bell notifications (connection requests, etc.) ──
    newSocket.on('notification', (data) => {
      notifyGeneral(data.message, {
        type: data.type,       // e.g. 'connection_request'
        actor: data.actorName, // who triggered it
      });
    });

    // ── 2. New direct message (only when not on /messages page) ──
    newSocket.on('message_received', (message) => {
      if (window.location.pathname.includes('/messages')) return;
      const sender = message.sender;
      notifyNewMessage({
        senderName: sender?.name || 'Someone',
        senderAvatar: sender?.avatar,
        preview: message.content,
        onClick: () => { window.location.href = `/messages?with=${sender?._id || ''}`; },
      });
    });

    // ── 3. Quest / achievement completed ──
    newSocket.on('quest_completed', (data) => {
      notifyQuestCompleted({
        questName: data.questName,
        xp: data.xp,
        badge: data.badge || null,
      });
    });

    // ── 4. SOS: incoming beacon — I can help ──
    newSocket.on('incoming_sos', (payload) => {
      notifySOSIncoming({
        payload,
        socket: newSocket,
        userName: user.name,
      });
    });

    // ── 5. SOS: nobody online to receive it ──
    newSocket.on('sos_no_experts', () => {
      notifySOSNoExperts();
    });

    // ── 6. SOS: server confirmed broadcast count ──
    newSocket.on('sos_broadcast_count', ({ count }) => {
      notifySOSBroadcast({ count });
    });

    // ── 7. SOS: accepted — launch the room ──
    newSocket.on('sos_accepted', ({ roomId, helperName, isHelper }) => {
      notifySOSAccepted({ helperName, isHelper });
      setTimeout(() => {
        window.location.href = `/study-room/${roomId}`;
      }, 2000);
    });

    // ── 8. SOS: server error ──
    newSocket.on('sos_error', ({ message }) => {
      notifySOSError({ message });
    });

    // ── 9. Badge unlocked ──
    newSocket.on('badge_unlocked', (data) => {
      notifySuccess(
        `Badge Unlocked: ${data.badge || data.name}`,
        data.description || 'Keep studying to unlock more achievements!'
      );
    });

    // ── 10. Session reminder ──
    newSocket.on('session_reminder', (data) => {
      notifyGeneral(
        `Your session "${data.title}" starts in ${data.minutesLeft || 15} minutes`,
        { type: 'session_reminder' }
      );
    });

    // Cleanup
    return () => {
      newSocket.off('connect');
      newSocket.off('notification');
      newSocket.off('message_received');
      newSocket.off('quest_completed');
      newSocket.off('incoming_sos');
      newSocket.off('sos_no_experts');
      newSocket.off('sos_broadcast_count');
      newSocket.off('sos_accepted');
      newSocket.off('sos_error');
      newSocket.off('badge_unlocked');
      newSocket.off('session_reminder');
      newSocket.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
