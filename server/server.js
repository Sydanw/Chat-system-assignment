const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const socketIo = require('socket.io');
const { ExpressPeerServer } = require('peer');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const channelRoutes = require('./routes/channels');
const imageRoutes = require('./routes/images');
const { initializeSocket } = require('./sockets');
const dataManager = require('./data/dataManager');

const app = express();

let server;
let options = {};

if (fs.existsSync('key.pem') && fs.existsSync('cert.pem')) {
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
    server = https.createServer(options, app);
} else {
    const http = require('http');
    server = http.createServer(app);
    console.warn('Warning: Running without HTTPS. SSL certificates not found.');
}

const peerServer = ExpressPeerServer(server, {
    path: '/',
    debug: true,
    ssl: options
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
    console.log('PeerJS client connected:', client.getId());
});

const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:4200", "https://localhost:4200"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET || 'vidchat-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 60 * 1000,
        secure: fs.existsSync('key.pem'),
        httpOnly: true
    }
}));

app.use(cors({
    origin: ['http://localhost:4200', 'https://localhost:4200'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/images', imageRoutes);

const clientDistPath = path.join(__dirname, '../client/chat-app/dist/chat-app/browser');
if (fs.existsSync(clientDistPath)) {
    app.use('/proxy/3000', express.static(clientDistPath));
    
    app.use(express.static(clientDistPath));
    
    app.get('/proxy/3000/*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
    
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/peerjs') && !req.path.startsWith('/uploads') && !req.path.startsWith('/proxy/3000')) {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        }
    });
    console.log('✓ Serving Angular frontend from:', clientDistPath);
    console.log('✓ Static files available at both / and /proxy/3000/');
} else {
    console.warn('✗ Angular frontend not found at:', clientDistPath);
    console.warn('Please deploy the Angular built files to:', clientDistPath);
}

initializeSocket(io);

async function startServer() {
    try {
        await dataManager.connect();
        console.log('✓ Connected to MongoDB successfully');
    } catch (error) {
        console.error('✗ MongoDB connection failed:', error.message);
        console.error('Please check:');
        console.error('1. MONGODB_URL environment variable is set');
        console.error('2. ELF server IP is whitelisted in MongoDB Atlas');
        console.error('3. MongoDB Atlas credentials are correct');
    }
    
    server.listen(PORT, () => {
        const protocol = fs.existsSync('key.pem') ? 'https' : 'http';
        console.log(`Server running on ${protocol}://localhost:${PORT}`);
        console.log('Socket.io initialized for real-time chat');
        console.log('PeerJS server running at /peerjs');
    });
}

startServer();

module.exports = app;
