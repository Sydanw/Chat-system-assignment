const express = require('express');
const router = express.Router();
const dataManager = require('../data/dataManager');

router.get('/', async (req, res) => {
    try {
        const channels = await dataManager.getChannels();
        res.json(channels);
    } catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/group/:groupId', async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const channels = await dataManager.getChannelsByGroupId(groupId);
        res.json(channels);
    } catch (error) {
        console.error('Get channels by group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:channelId/messages', async (req, res) => {
    try {
        const channelId = parseInt(req.params.channelId);
        const messages = await dataManager.getMessagesByChannel(channelId, 100);
        res.json(messages);
    } catch (error) {
        console.error('Error reading messages:', error);
        res.status(500).json({ error: 'Failed to read messages' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const channel = await dataManager.getChannelById(parseInt(req.params.id));
        if (channel) {
            res.json(channel);
        } else {
            res.status(404).json({ message: 'Channel not found' });
        }
    } catch (error) {
        console.error('Get channel error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, groupId, description } = req.body;
        
        if (!name || !groupId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and groupId are required' 
            });
        }

        const group = await dataManager.getGroupById(groupId);
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        const newChannel = await dataManager.createChannel({
            name,
            groupId,
            description: description || '',
            members: []
        });

        group.channels.push(newChannel._id);
        await dataManager.updateGroup(groupId, { channels: group.channels });

        res.status(201).json({
            success: true,
            channel: newChannel,
            message: 'Channel created successfully'
        });
    } catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const updatedChannel = await dataManager.updateChannel(channelId, req.body);
        
        if (updatedChannel) {
            res.json({
                success: true,
                channel: updatedChannel,
                message: 'Channel updated successfully'
            });
        } else {
            res.status(404).json({ message: 'Channel not found' });
        }
    } catch (error) {
        console.error('Update channel error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const channel = await dataManager.getChannelById(channelId);
        
        if (channel) {
            const group = await dataManager.getGroupById(channel.groupId);
            if (group) {
                group.channels = group.channels.filter(id => id !== channelId);
                await dataManager.updateGroup(channel.groupId, { channels: group.channels });
            }
            
            await dataManager.deleteChannel(channelId);
            
            res.json({ 
                success: true,
                message: 'Channel deleted successfully' 
            });
        } else {
            res.status(404).json({ message: 'Channel not found' });
        }
    } catch (error) {
        console.error('Delete channel error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/members', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const { userId } = req.body;
        
        const channel = await dataManager.getChannelById(channelId);
        const user = await dataManager.getUserById(userId);
        
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!channel.members) {
            channel.members = [];
        }
        
        if (!channel.members.includes(userId)) {
            channel.members.push(userId);
            await dataManager.updateChannel(channelId, { members: channel.members });
        }
        
        res.json({
            success: true,
            message: 'User added to channel successfully'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        
        const channel = await dataManager.getChannelById(channelId);
        
        if (channel) {
            if (channel.members) {
                channel.members = channel.members.filter(id => id !== userId);
                await dataManager.updateChannel(channelId, { members: channel.members });
            }
            res.json({
                success: true,
                message: 'User removed from channel successfully'
            });
        } else {
            res.status(404).json({ message: 'Channel not found' });
        }
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
