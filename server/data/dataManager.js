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
        const newUser = {
            id: Math.max(...this.data.users.map(u => u.id)) + 1,
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

    createGroup(groupData) {
        const newGroup = {
            id: Math.max(0, ...this.data.groups.map(g => g.id)) + 1,
            ...groupData,
            members: [],
            admins: [groupData.createdBy],
            channels: []
        };
        this.data.groups.push(newGroup);
        this.saveData();
        return newGroup;
    }

    // Channel operations
    getChannels() {
        return this.data.channels;
    }

    createChannel(channelData) {
        const newChannel = {
            id: Math.max(0, ...this.data.channels.map(c => c.id)) + 1,
            ...channelData
        };
        this.data.channels.push(newChannel);
        this.saveData();
        return newChannel;
    }
}

module.exports = new DataManager();