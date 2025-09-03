const dataManager = require('./data/dataManager');

function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-channel', (data) => {
      const { channelId, userId, username } = data;
      socket.join(`channel-${channelId}`);
      socket.userId = userId;
      socket.username = username;
      socket.currentChannel = channelId;
      
      console.log(`${username} joined channel ${channelId}`);
      
      socket.to(`channel-${channelId}`).emit('user-joined', {
        username: username,
        message: `${username} joined the channel`
      });
    });

    socket.on('send-message', (data) => {
      const { channelId, userId, username, content } = data;
      
      const message = {
        id: Date.now(),
        channelId: parseInt(channelId),
        userId: parseInt(userId),
        username: username,
        content: content,
        timestamp: new Date().toISOString()
      };

      try {
        if (!dataManager.data.messages) {
          dataManager.data.messages = [];
        }
        dataManager.data.messages.push(message);
        dataManager.saveData();

        io.to(`channel-${channelId}`).emit('new-message', message);
        console.log(`Message from ${username} in channel ${channelId}: ${content}`);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message-error', { error: 'Failed to save message' });
      }
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
