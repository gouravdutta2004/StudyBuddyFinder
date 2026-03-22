require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

connectDB();

const app = express();
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://studybuddyfinder.pages.dev',
    /\.studybuddyfinder\.pages\.dev$/
  ], 
  credentials: true 
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/sessions', require('./src/routes/sessions'));
app.use('/api/rooms', require('./src/routes/room'));
app.use('/api/groups', require('./src/routes/groups'));
app.use('/api/ratings', require('./src/routes/ratings'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/gamification', require('./src/routes/gamification'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/calendar', require('./src/routes/calendar'));
app.use('/api/ai', require('./src/routes/ai'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'StudyBuddyFinder API running' }));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🟢 Socket initialized: ', socket.id);

  socket.on('setup', (userId) => {
    socket.join(userId);
  });

  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  socket.on('typing', (data) => socket.to(data.receiver).emit('typing', data));
  socket.on('stop_typing', (data) => socket.to(data.receiver).emit('stop_typing', data));

  socket.on('new_message', (message) => {
    socket.to(message.receiver).emit('message_received', message);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket terminated: ', socket.id);
  });

  // Collaboration Features: WebRTC and Whiteboard
  socket.on('join_study_room', (roomId) => {
    socket.join(roomId);
    // Notify others that a new user joined this room
    socket.to(roomId).emit('user_joined_room', socket.id);
  });

  socket.on('room_message', ({ roomId, message }) => {
    socket.to(roomId).emit('room_message', message);
  });

  socket.on('webrtc_signal', (data) => {
    // data: { to: socketId, signal: object }
    // Send the signal to the specific peer
    io.to(data.to).emit('webrtc_signal', {
      signal: data.signal,
      from: socket.id
    });
  });

  socket.on('whiteboard_update', ({ roomId, elements }) => {
    socket.to(roomId).emit('whiteboard_update', elements);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} with WebSockets enabled`));
