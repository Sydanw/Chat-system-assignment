const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const dataManager = require('./data/dataManager'); // or './dataManager'

// Import DataManager for JSON persistence
const dataManager = require('./data/dataManager');

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

const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (optional for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    users: dataManager.getUsers().length,
    groups: dataManager.getGroups().length,
    channels: dataManager.getChannels().length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize server with DataManager
async function initializeServer() {
  try {
    console.log('Initializing server...');
    
    // Load existing data from JSON file
    console.log('Loading data from JSON file...');
    const users = dataManager.getUsers();
    const groups = dataManager.getGroups();
    const channels = dataManager.getChannels();
    
    console.log(`Loaded data:
    - Users: ${users.length}
    - Groups: ${groups.length}  
    - Channels: ${channels.length}`);
    
    // Ensure we have at least one Super Admin user
    const superAdmins = users.filter(user => user.roles.includes('Super Admin'));
    
    if (superAdmins.length === 0) {
      console.log('No Super Admin found, creating default Super Admin...');
      
      try {
        const defaultSuperAdmin = dataManager.createUser({
          username: 'super',
          email: 'super@admin.com',
          password: '123',
          roles: ['Super Admin'],
          groups: []
        });
        
        console.log(`Created default Super Admin: ${defaultSuperAdmin.username}`);
      } catch (error) {
        if (error.message === 'User already exists') {
          console.log('Super Admin user already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log(`Found ${superAdmins.length} Super Admin(s)`);
    }
    
    // Initialize Socket.IO
    initializeSocket(io);
    console.log('Socket.IO initialized for real-time chat');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`
========================================
🚀 Server Started Successfully!
========================================
🌐 Server URL: http://localhost:${PORT}
🔗 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/api/health
========================================
📋 Available APIs:
   POST /api/auth/login
   POST /api/auth/logout
   GET  /api/users
   POST /api/users
   PUT  /api/users/:id
   DELETE /api/users/:id
   POST /api/users/:id/promote-group-admin
   POST /api/users/:id/promote-super-admin
   GET  /api/users/stats/overview
   GET  /api/groups
   GET  /api/channels
========================================
💾 Data Persistence: JSON file-based
🔄 Real-time: Socket.IO enabled
📱 CORS: Enabled for Angular (localhost:4200)
========================================
      `);
      
      // Display current system stats
      setTimeout(() => {
        const currentUsers = dataManager.getUsers();
        const currentGroups = dataManager.getGroups();
        const currentChannels = dataManager.getChannels();
        
        console.log(`
📊 Current System Statistics:
   👥 Total Users: ${currentUsers.length}
   🏢 Total Groups: ${currentGroups.length}
   💬 Total Channels: ${currentChannels.length}
   👑 Super Admins: ${currentUsers.filter(u => u.roles.includes('Super Admin')).length}
   🛡️  Group Admins: ${currentUsers.filter(u => u.roles.includes('Group Admin')).length}
   👤 Regular Users: ${currentUsers.filter(u => u.roles.includes('User') && !u.roles.includes('Super Admin') && !u.roles.includes('Group Admin')).length}
        `);
      }, 1000);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed.');
    
    // Ensure final data save
    try {
      console.log('💾 Saving final data state...');
      // DataManager automatically saves, but let's log it
      const users = dataManager.getUsers();
      console.log(`💾 Final save: ${users.length} users preserved`);
    } catch (error) {
      console.error('❌ Error during final save:', error);
    }
    
    console.log('👋 Server shutdown complete.');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('🚨 Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server terminated.');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
initializeServer();

module.exports = app;