const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

// Get all users (Super Admin only)
router.get('/', (req, res) => {
    const users = dataManager.getUsers().map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
    res.json(users);
});

// Get user by ID
router.get('/:id', (req, res) => {
    const user = dataManager.getUserById(parseInt(req.params.id));
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

router.post('/', requireSuperAdmin, (req, res) => {
  console.log('Creating user:', req.body);
  // ... existing code
  console.log('User created, saved to:', dataManager.dataFile);
});

// Update user (promote/demote roles)
router.put('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedUser = dataManager.updateUser(userId, updates);
    if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Delete user
router.delete('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const success = dataManager.deleteUser(userId);
    
    if (success) {
        res.json({ message: 'User deleted successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

module.exports = router;