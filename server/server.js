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
        origin: (origin, callback) => {
            if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
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
    origin: (origin, callback) => {
        console.log('CORS: Received request from origin:', origin);
        
        if (!origin) {
            console.log('CORS: No origin header (server-to-server request) - allowing');
            return callback(null, true);
        }
        
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
            console.log('CORS: Localhost origin detected - allowing');
            return callback(null, true);
        }
        
        console.log('CORS: Origin not in whitelist - blocking');
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log('Manual CORS Middleware: Processing request from origin:', origin);
    
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:'))) {
        console.log('Manual CORS Middleware: Setting CORS headers for', origin);
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    if (req.method === 'OPTIONS') {
        console.log('Manual CORS Middleware: Responding to OPTIONS preflight');
        return res.sendStatus(200);
    }
    
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/images', imageRoutes);

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
