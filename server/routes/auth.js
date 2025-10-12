const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await dataManager.getUserByUsername(username);
        
        if (user && user.password === password) {
            req.session.userId = user._id;
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password, roles } = req.body;
    
    try {
        const existingUser = await dataManager.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        const newUser = await dataManager.createUser({
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
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
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

router.get('/validate-session', async (req, res) => {
    try {
        if (req.session && req.session.userId) {
            const user = await dataManager.getUserById(req.session.userId);
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
    } catch (error) {
        console.error('Validate session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
