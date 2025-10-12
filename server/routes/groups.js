const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

router.get('/', async (req, res) => {
    try {
        const groups = await dataManager.getGroups();
        res.json(groups);
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const group = await dataManager.getGroupById(parseInt(req.params.id));
        if (group) {
            res.json(group);
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, createdBy } = req.body;
        
        if (!name || !createdBy) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and createdBy are required' 
            });
        }

        const newGroup = await dataManager.createGroup({
            name,
            description: description || '',
            createdBy
        });

        res.status(201).json({
            success: true,
            group: newGroup,
            message: 'Group created successfully'
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const updatedGroup = await dataManager.updateGroup(groupId, req.body);
        
        if (updatedGroup) {
            res.json({
                success: true,
                group: updatedGroup,
                message: 'Group updated successfully'
            });
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const success = await dataManager.deleteGroup(groupId);
        
        if (success) {
            res.json({ 
                success: true,
                message: 'Group deleted successfully' 
            });
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/members', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { userId } = req.body;
        
        const group = await dataManager.getGroupById(groupId);
        const user = await dataManager.getUserById(userId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await dataManager.updateGroup(groupId, { members: group.members });
        }
        
        res.json({
            success: true,
            message: 'User added to group successfully'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        
        const group = await dataManager.getGroupById(groupId);
        
        if (group) {
            group.members = group.members.filter(id => id !== userId);
            await dataManager.updateGroup(groupId, { members: group.members });
            res.json({
                success: true,
                message: 'User removed from group successfully'
            });
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
