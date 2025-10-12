const mongoManager = require('./data/dataManager');

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-channel', async (data) => {
            const { channelId, userId, username } = data;
            socket.join(`channel-${channelId}`);
            socket.userId = userId;
            socket.username = username;
            socket.currentChannel = channelId;
            
            console.log(`${username} joined channel ${channelId}`);
            
            try {
                const messages = await mongoManager.getMessagesByChannel(channelId, 50);
                socket.emit('message-history', messages);
            } catch (error) {
                console.error('Error loading message history:', error);
            }
            
            socket.to(`channel-${channelId}`).emit('user-joined', {
                username: username,
                message: `${username} joined the channel`
            });
        });

        socket.on('send-message', async (data) => {
            const { channelId, userId, username, content, imageUrl } = data;
            
            try {
                const message = {
                    channelId: parseInt(channelId),
                    userId: parseInt(userId),
                    username: username,
                    content: content,
                    imageUrl: imageUrl || null,
                    timestamp: new Date()
                };

                await mongoManager.createMessage(message);
                io.to(`channel-${channelId}`).emit('new-message', message);
                console.log(`Message from ${username} in channel ${channelId}`);
            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('message-error', { error: 'Failed to save message' });
            }
        });

        socket.on('share-peer-id', (data) => {
            const { channelId, peerId } = data;
            socket.to(`channel-${channelId}`).emit('peer-id-shared', {
                username: socket.username,
                peerId: peerId
            });
        });

        socket.on('video-offer', (data) => {
            socket.to(`channel-${data.channelId}`).emit('video-offer', data);
        });

        socket.on('video-answer', (data) => {
            socket.to(`channel-${data.channelId}`).emit('video-answer', data);
        });

        socket.on('ice-candidate', (data) => {
            socket.to(`channel-${data.channelId}`).emit('ice-candidate', data);
        });

        socket.on('leave-channel', (data) => {
            const { channelId } = data;
            socket.leave(`channel-${channelId}`);
            
            if (socket.username) {
                socket.to(`channel-${channelId}`).emit('user-left', {
                    username: socket.username,
                    message: `${socket.username} left the channel`
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            if (socket.currentChannel && socket.username) {
                socket.to(`channel-${socket.currentChannel}`).emit('user-left', {
                    username: socket.username,
                    message: `${socket.username} disconnected`
                });
            }
        });
    });
}

module.exports = { initializeSocket };
