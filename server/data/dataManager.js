const jsonfile = require('jsonfile');
const path = require('path');

class DataManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'chatData.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            return jsonfile.readFileSync(this.dataFile);
        } catch (error) {
            // Initialize with default super admin user
            const defaultData = {
                users: [
                    {
                        id: 1,
                        username: 'super',
                        email: 'super@admin.com',
                        password: '123',
                        roles: ['Super Admin'],
                        groups: []
                    }
                ],
                groups: [],
                channels: []
            };
            this.saveData(defaultData);
            return defaultData;
        }
    }

    saveData(data = this.data) {
        jsonfile.writeFileSync(this.dataFile, data, { spaces: 2 });
        this.data = data;
    }

    // User operations
    getUsers() {
        return this.data.users;
    }

    getUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    getUserByUsername(username) {
        return this.data.users.find(user => user.username === username);
    }

    createUser(userData) {
        // Fix: Handle empty users array
        const maxId = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) : 0;
        const newUser = {
            id: maxId + 1,
            ...userData,
            roles: userData.roles || ['User'],
            groups: []
        };
        this.data.users.push(newUser);
        this.saveData();
        return newUser;
    }

    updateUser(id, updates) {
        const userIndex = this.data.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
            this.saveData();
            return this.data.users[userIndex];
        }
        return null;
    }

    deleteUser(id) {
        const userIndex = this.data.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            this.data.users.splice(userIndex, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Group operations
    getGroups() {
        return this.data.groups;
    }

    getGroupById(id) {
        return this.data.groups.find(group => group.id === id);
    }

    createGroup(groupData) {
        // Fix: Handle empty groups array
        const maxId = this.data.groups.length > 0 ? Math.max(...this.data.groups.map(g => g.id)) : 0;
        const newGroup = {
            id: maxId + 1,
            ...groupData,
            members: [],
            admins: [groupData.createdBy],
            channels: []
        };
        this.data.groups.push(newGroup);
        this.saveData();
        return newGroup;
    }

    updateGroup(id, updates) {
        const groupIndex = this.data.groups.findIndex(group => group.id === id);
        if (groupIndex !== -1) {
            this.data.groups[groupIndex] = { ...this.data.groups[groupIndex], ...updates };
            this.saveData();
            return this.data.groups[groupIndex];
        }
        return null;
    }

    deleteGroup(id) {
        const groupIndex = this.data.groups.findIndex(group => group.id === id);
        if (groupIndex !== -1) {
            // Also remove associated channels
            this.data.channels = this.data.channels.filter(c => c.groupId !== id);
            this.data.groups.splice(groupIndex, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Channel operations
    getChannels() {
        return this.data.channels;
    }

    getChannelById(id) {
        return this.data.channels.find(channel => channel.id === id);
    }

    getChannelsByGroupId(groupId) {
        return this.data.channels.filter(channel => channel.groupId === groupId);
    }

    createChannel(channelData) {
        // Fix: Handle empty channels array
        const maxId = this.data.channels.length > 0 ? Math.max(...this.data.channels.map(c => c.id)) : 0;
        const newChannel = {
            id: maxId + 1,
            ...channelData,
            members: channelData.members || []
        };
        this.data.channels.push(newChannel);
        this.saveData();
        return newChannel;
    }

    updateChannel(id, updates) {
        const channelIndex = this.data.channels.findIndex(channel => channel.id === id);
        if (channelIndex !== -1) {
            this.data.channels[channelIndex] = { ...this.data.channels[channelIndex], ...updates };
            this.saveData();
            return this.data.channels[channelIndex];
        }
        return null;
    }

    deleteChannel(id) {
        const channelIndex = this.data.channels.findIndex(channel => channel.id === id);
        if (channelIndex !== -1) {
            const channel = this.data.channels[channelIndex];
            
            // Remove channel from group's channels array
            const group = this.data.groups.find(g => g.id === channel.groupId);
            if (group) {
                group.channels = group.channels.filter(cId => cId !== id);
            }
            
            this.data.channels.splice(channelIndex, 1);
            this.saveData();
            return true;
        }
        return false;
    }
}

module.exports = new DataManager();