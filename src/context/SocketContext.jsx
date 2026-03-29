import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001', {
            withCredentials: true
        });
        setSocket(newSocket);

        newSocket.emit('setup', user._id);

        newSocket.on('notification', (data) => {
            toast(data.message, {
                icon: '🔔',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        });

        newSocket.on('message_received', (message) => {
            // Check if user is currently on the messages page
            if (!window.location.pathname.includes('/messages')) {
                toast(`New message from ${message.senderName || 'a connection'}`, {
                    icon: '💬',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            }
        });

        return () => {
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
