const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = dataManager.getUserByUsername(username);
    
    if (user && user.password === password) {
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

module.exports = router;