const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

// Get all channels
router.get('/', (req, res) => {
    const channels = dataManager.getChannels();
    res.json(channels);
});

// Get channels by group ID
router.get('/group/:groupId', (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const channels = dataManager.data.channels.filter(c => c.groupId === groupId);
    res.json(channels);
});

router.get('/:channelId/messages', (req, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const messages = (dataManager.data.messages || []).filter(msg => msg.channelId === channelId);
    res.json(messages);
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages' });
  }
});

// Get channel by ID
router.get('/:id', (req, res) => {
    const channel = dataManager.data.channels.find(c => c.id === parseInt(req.params.id));
    if (channel) {
        res.json(channel);
    } else {
        res.status(404).json({ message: 'Channel not found' });
    }
});

// Create new channel
router.post('/', (req, res) => {
    const { name, groupId, description } = req.body;
    
    if (!name || !groupId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Name and groupId are required' 
        });
    }

    // Check if group exists
    const group = dataManager.data.groups.find(g => g.id === groupId);
    if (!group) {
        return res.status(404).json({ 
            success: false, 
            message: 'Group not found' 
        });
    }

    const newChannel = dataManager.createChannel({
        name,
        groupId,
        description: description || '',
        members: []
    });

    // Add channel to group's channels array
    group.channels.push(newChannel.id);
    dataManager.saveData();

    res.status(201).json({
        success: true,
        channel: newChannel,
        message: 'Channel created successfully'
    });
});

// Update channel
router.put('/:id', (req, res) => {
    const channelId = parseInt(req.params.id);
    const channelIndex = dataManager.data.channels.findIndex(c => c.id === channelId);
    
    if (channelIndex !== -1) {
        dataManager.data.channels[channelIndex] = { 
            ...dataManager.data.channels[channelIndex], 
            ...req.body 
        };
        dataManager.saveData();
        res.json({
            success: true,
            channel: dataManager.data.channels[channelIndex],
            message: 'Channel updated successfully'
        });
    } else {
        res.status(404).json({ message: 'Channel not found' });
    }
});

// Delete channel
router.delete('/:id', (req, res) => {
    const channelId = parseInt(req.params.id);
    const channelIndex = dataManager.data.channels.findIndex(c => c.id === channelId);
    
    if (channelIndex !== -1) {
        const channel = dataManager.data.channels[channelIndex];
        
        // Remove channel from group's channels array
        const group = dataManager.data.groups.find(g => g.id === channel.groupId);
        if (group) {
            group.channels = group.channels.filter(id => id !== channelId);
        }
        
        // Remove the channel
        dataManager.data.channels.splice(channelIndex, 1);
        dataManager.saveData();
        
        res.json({ 
            success: true,
            message: 'Channel deleted successfully' 
        });
    } else {
        res.status(404).json({ message: 'Channel not found' });
    }
});

// Add user to channel
router.post('/:id/members', (req, res) => {
    const channelId = parseInt(req.params.id);
    const { userId } = req.body;
    
    const channelIndex = dataManager.data.channels.findIndex(c => c.id === channelId);
    const user = dataManager.getUserById(userId);
    
    if (channelIndex === -1) {
        return res.status(404).json({ message: 'Channel not found' });
    }
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    if (!dataManager.data.channels[channelIndex].members) {
        dataManager.data.channels[channelIndex].members = [];
    }
    
    if (!dataManager.data.channels[channelIndex].members.includes(userId)) {
        dataManager.data.channels[channelIndex].members.push(userId);
        dataManager.saveData();
    }
    
    res.json({
        success: true,
        message: 'User added to channel successfully'
    });
});

// Remove user from channel
router.delete('/:id/members/:userId', (req, res) => {
    const channelId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    const channelIndex = dataManager.data.channels.findIndex(c => c.id === channelId);
    
    if (channelIndex !== -1) {
        if (dataManager.data.channels[channelIndex].members) {
            dataManager.data.channels[channelIndex].members = 
                dataManager.data.channels[channelIndex].members.filter(id => id !== userId);
            dataManager.saveData();
        }
        res.json({
            success: true,
            message: 'User removed from channel successfully'
        });
    } else {
        res.status(404).json({ message: 'Channel not found' });
    }
});

module.exports = router;
