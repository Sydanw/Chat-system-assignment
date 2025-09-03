const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const channelRoutes = require('./routes/channels');
const { initializeSocket } = require('./sockets');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 3000;

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Middleware
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);

initializeSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Socket.io initialized for real-time chat');
});

module.exports = app;
