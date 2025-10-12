const { MongoClient } = require('mongodb');

class MongoDBManager {
    constructor() {
        this.url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.dbName = 'VidChatApp';
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (!this.client) {
            this.client = await MongoClient.connect(this.url, { 
                useNewUrlParser: true, 
                useUnifiedTopology: true 
            });
            this.db = this.client.db(this.dbName);
            await this.initializeDefaultData();
        }
        return this.db;
    }

    async initializeDefaultData() {
        const usersCount = await this.db.collection('users').countDocuments();
        if (usersCount === 0) {
            await this.db.collection('users').insertMany([
                { 
                    _id: 1, 
                    username: 'super', 
                    email: 'super@admin.com', 
                    password: '123', 
                    roles: ['Super Admin'], 
                    groups: [1, 2, 3], 
                    avatar: null 
                },
                { 
                    _id: 2, 
                    username: 'group_admin', 
                    email: 'group_admin@test.com', 
                    password: '123',
                    roles: ['Group Admin'], 
                    groups: [2, 4], 
                    avatar: null 
                },
                { 
                    _id: 3, 
                    username: 'john_doe', 
                    email: 'john@test.com', 
                    password: '123',
                    roles: ['User'], 
                    groups: [1, 4, 5], 
                    avatar: null 
                }
            ]);
            
            await this.db.collection('groups').insertMany([
                { 
                    _id: 1, 
                    name: 'General Discussion', 
                    description: 'Main discussion group',
                    createdBy: 1, 
                    members: [1, 2, 3], 
                    admins: [1], 
                    channels: [1, 2, 3] 
                },
                { 
                    _id: 2, 
                    name: 'Development Team', 
                    description: 'Development team discussions',
                    createdBy: 2, 
                    members: [1, 2], 
                    admins: [2], 
                    channels: [4, 5, 6] 
                }
            ]);
            
            await this.db.collection('channels').insertMany([
                { 
                    _id: 1, 
                    name: 'general', 
                    description: 'General discussion channel',
                    groupId: 1, 
                    members: [1, 2, 3] 
                },
                { 
                    _id: 2, 
                    name: 'announcements', 
                    description: 'Important announcements',
                    groupId: 1, 
                    members: [1, 2, 3] 
                },
                { 
                    _id: 4, 
                    name: 'dev-general', 
                    description: 'Development general discussion',
                    groupId: 2, 
                    members: [1, 2] 
                }
            ]);
        }
    }

    async getUsers() {
        await this.connect();
        return await this.db.collection('users').find({}).toArray();
    }

    async getUserById(id) {
        await this.connect();
        return await this.db.collection('users').findOne({ _id: parseInt(id) });
    }

    async getUserByUsername(username) {
        await this.connect();
        return await this.db.collection('users').findOne({ username });
    }

    async createUser(userData) {
        await this.connect();
        const maxUser = await this.db.collection('users').find().sort({ _id: -1 }).limit(1).toArray();
        const newId = maxUser.length > 0 ? maxUser[0]._id + 1 : 1;
        const newUser = {
            _id: newId,
            ...userData,
            roles: userData.roles || ['User'],
            groups: [],
            avatar: null
        };
        await this.db.collection('users').insertOne(newUser);
        return newUser;
    }

    async updateUser(id, updates) {
        await this.connect();
        await this.db.collection('users').updateOne(
            { _id: parseInt(id) },
            { $set: updates }
        );
        return await this.getUserById(id);
    }

    async deleteUser(id) {
        await this.connect();
        const result = await this.db.collection('users').deleteOne({ _id: parseInt(id) });
        return result.deletedCount > 0;
    }

    async getGroups() {
        await this.connect();
        return await this.db.collection('groups').find({}).toArray();
    }

    async getGroupById(id) {
        await this.connect();
        return await this.db.collection('groups').findOne({ _id: parseInt(id) });
    }

    async createGroup(groupData) {
        await this.connect();
        const maxGroup = await this.db.collection('groups').find().sort({ _id: -1 }).limit(1).toArray();
        const newId = maxGroup.length > 0 ? maxGroup[0]._id + 1 : 1;
        const newGroup = {
            _id: newId,
            ...groupData,
            members: [],
            admins: [groupData.createdBy],
            channels: []
        };
        await this.db.collection('groups').insertOne(newGroup);
        return newGroup;
    }

    async updateGroup(id, updates) {
        await this.connect();
        await this.db.collection('groups').updateOne(
            { _id: parseInt(id) },
            { $set: updates }
        );
        return await this.getGroupById(id);
    }

    async deleteGroup(id) {
        await this.connect();
        await this.db.collection('channels').deleteMany({ groupId: parseInt(id) });
        const result = await this.db.collection('groups').deleteOne({ _id: parseInt(id) });
        return result.deletedCount > 0;
    }

    async getChannels() {
        await this.connect();
        return await this.db.collection('channels').find({}).toArray();
    }

    async getChannelById(id) {
        await this.connect();
        return await this.db.collection('channels').findOne({ _id: parseInt(id) });
    }

    async getChannelsByGroupId(groupId) {
        await this.connect();
        return await this.db.collection('channels').find({ groupId: parseInt(groupId) }).toArray();
    }

    async createChannel(channelData) {
        await this.connect();
        const maxChannel = await this.db.collection('channels').find().sort({ _id: -1 }).limit(1).toArray();
        const newId = maxChannel.length > 0 ? maxChannel[0]._id + 1 : 1;
        const newChannel = {
            _id: newId,
            ...channelData,
            members: channelData.members || []
        };
        await this.db.collection('channels').insertOne(newChannel);
        return newChannel;
    }

    async updateChannel(id, updates) {
        await this.connect();
        await this.db.collection('channels').updateOne(
            { _id: parseInt(id) },
            { $set: updates }
        );
        return await this.getChannelById(id);
    }

    async deleteChannel(id) {
        await this.connect();
        const channel = await this.getChannelById(id);
        if (channel) {
            await this.db.collection('groups').updateOne(
                { _id: channel.groupId },
                { $pull: { channels: parseInt(id) } }
            );
        }
        const result = await this.db.collection('channels').deleteOne({ _id: parseInt(id) });
        return result.deletedCount > 0;
    }

    async createMessage(messageData) {
        await this.connect();
        const message = {
            ...messageData,
            channelId: parseInt(messageData.channelId),
            userId: parseInt(messageData.userId),
            timestamp: messageData.timestamp || new Date()
        };
        const result = await this.db.collection('messages').insertOne(message);
        return { _id: result.insertedId, ...message };
    }

    async getMessagesByChannel(channelId, limit = 50) {
        await this.connect();
        return await this.db.collection('messages')
            .find({ channelId: parseInt(channelId) })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray()
            .then(messages => messages.reverse());
    }
}

module.exports = new MongoDBManager();
