const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = dataManager.getUserByUsername(username);
    
    if (user && user.password === password) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.roles = user.roles;
        req.session.loginTime = new Date();
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

// Register route (for Super Admin to create users)
router.post('/register', (req, res) => {
    const { username, email, password, roles } = req.body;
    
    // Check if username already exists
    if (dataManager.getUserByUsername(username)) {
        return res.status(400).json({
            success: false,
            message: 'Username already exists'
        });
    }
    
    const newUser = dataManager.createUser({
        username,
        email,
        password,
        roles: roles || ['User']
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
        success: true,
        user: userWithoutPassword,
        message: 'User created successfully'
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Could not log out'
            });
        }
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

router.get('/validate-session', (req, res) => {
    if (req.session && req.session.userId) {
        const user = dataManager.getUserById(req.session.userId);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            return res.json({
                success: true,
                user: userWithoutPassword
            });
        }
    }
    
    res.status(401).json({
        success: false,
        message: 'Invalid session'
    });
});

module.exports = router;
