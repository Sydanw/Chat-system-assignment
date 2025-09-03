const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

// Get all groups
router.get('/', (req, res) => {
    const groups = dataManager.getGroups();
    res.json(groups);
});

// Get group by ID
router.get('/:id', (req, res) => {
    const group = dataManager.data.groups.find(g => g.id === parseInt(req.params.id));
    if (group) {
        res.json(group);
    } else {
        res.status(404).json({ message: 'Group not found' });
    }
});

// Create new group
router.post('/', (req, res) => {
    const { name, description, createdBy } = req.body;
    
    if (!name || !createdBy) {
        return res.status(400).json({ 
            success: false, 
            message: 'Name and createdBy are required' 
        });
    }

    const newGroup = dataManager.createGroup({
        name,
        description: description || '',
        createdBy
    });

    res.status(201).json({
        success: true,
        group: newGroup,
        message: 'Group created successfully'
    });
});

// Update group
router.put('/:id', (req, res) => {
    const groupId = parseInt(req.params.id);
    const groupIndex = dataManager.data.groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
        dataManager.data.groups[groupIndex] = { 
            ...dataManager.data.groups[groupIndex], 
            ...req.body 
        };
        dataManager.saveData();
        res.json({
            success: true,
            group: dataManager.data.groups[groupIndex],
            message: 'Group updated successfully'
        });
    } else {
        res.status(404).json({ message: 'Group not found' });
    }
});

// Delete group
router.delete('/:id', (req, res) => {
    const groupId = parseInt(req.params.id);
    const groupIndex = dataManager.data.groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
        // Also remove associated channels
        dataManager.data.channels = dataManager.data.channels.filter(c => c.groupId !== groupId);
        dataManager.data.groups.splice(groupIndex, 1);
        dataManager.saveData();
        res.json({ 
            success: true,
            message: 'Group deleted successfully' 
        });
    } else {
        res.status(404).json({ message: 'Group not found' });
    }
});

// Add user to group
router.post('/:id/members', (req, res) => {
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;
    
    const groupIndex = dataManager.data.groups.findIndex(g => g.id === groupId);
    const user = dataManager.getUserById(userId);
    
    if (groupIndex === -1) {
        return res.status(404).json({ message: 'Group not found' });
    }
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    if (!dataManager.data.groups[groupIndex].members.includes(userId)) {
        dataManager.data.groups[groupIndex].members.push(userId);
        dataManager.saveData();
    }
    
    res.json({
        success: true,
        message: 'User added to group successfully'
    });
});

// Remove user from group
router.delete('/:id/members/:userId', (req, res) => {
    const groupId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    const groupIndex = dataManager.data.groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
        dataManager.data.groups[groupIndex].members = 
            dataManager.data.groups[groupIndex].members.filter(id => id !== userId);
        dataManager.saveData();
        res.json({
            success: true,
            message: 'User removed from group successfully'
        });
    } else {
        res.status(404).json({ message: 'Group not found' });
    }
});

module.exports = router;