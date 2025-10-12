# Chat System Assignment - Phase 2

## MongoDB Setup on ELF Server

Before running the server, MongoDB must be installed on the ELF server:

```bash
ssh s5414889@elf.ict.griffith.edu.au

wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

sudo systemctl start mongod
sudo systemctl enable mongod

mongosh
use VidChatApp
db.createCollection("users")
db.createCollection("groups")
db.createCollection("channels")
db.createCollection("messages")
exit
```

# Chat System Assignment - Phase 1 & Phase 2

## Git Repository Organization

### Branch Strategy
- **main**: Primary development branch
- **Client/chat-app** - Frontend
- **server** - Backend
- **feature/auth**: Authentication implementation
- **feature/admin**: Admin panel features
- **documentation**: Documentation updates

### Update Frequency
Commits made after each major feature implementation with descriptive messages following the pattern: "type: description"

### Repository Structure
Chat-system-assignment/
├── client/
│   └── chat-app/
│       └── src/
│           └── app/
│               ├── components/
│               │   ├── dashboard/
│               │   ├── admin-panel/
│               │   ├── home/
│               │   ├── login/
│               │   ├── group-management/
│               │   └── channel-view/
│               ├── services/
│               │   ├── auth.service.ts
│               │   ├── user.service.ts
│               │   ├── socket.service.ts
│               │   └── session.service.ts
│               ├── guards/
│               │   └── auth-guard.ts
│               └── models/
│                   ├── user.model.ts
│                   ├── group.model.ts
│                   └── channel.model.ts
└── server/
    ├── server.js
    ├── sockets.js
    ├── data/
    │   ├── chatData.json
    │   └── dataManager.js
    └── routes/
        ├── auth.js
        ├── users.js
        ├── groups.js
        └── channels.js


## Data Structures (MongoDB Collections)

### Users Collection
```javascript
{
  _id: number,
  username: string,
  email: string,
  password: string,
  roles: string[],        // ['User', 'Group Admin', 'Super Admin']
  groups: number[],       // Array of group IDs user belongs to
  avatar: string | null   // Path to avatar image (/uploads/filename.jpg)
}
```

### Groups Collection
```javascript
{
  _id: number,
  name: string,
  description: string,
  createdBy: number,      // User ID of creator
  members: number[],      // Array of user IDs
  admins: number[],       // Array of user IDs with admin rights
  channels: number[]      // Array of channel IDs
}
```

### Channels Collection
```javascript
{
  _id: number,
  name: string,
  groupId: number,
  description: string,
  members: number[]       // Array of user IDs
}
```

### Messages Collection (Phase 2)
```javascript
{
  _id: ObjectId,
  channelId: number,
  userId: number,
  username: string,
  content: string,
  imageUrl: string | null,  // Path to image if message contains image
  timestamp: Date
}
```

#####
Angular Architecture
Components

LoginComponent: Handles user authentication
DashboardComponent: Main application interface
AdminPanelComponent: Super admin user management
GroupManagementComponent: Group creation and management
ChannelViewComponent: Channel interface and chat

Services

AuthService: Authentication state management and localStorage persistence
UserService: User CRUD operations
GroupService: Group management operations
ChannelService: Channel operations

Models

User: User entity interface
Group: Group entity interface
Channel: Channel entity interface
LoginRequest/Response: Authentication DTOs

Routes

/login: Authentication page
/dashboard: Main application (requires auth)
/admin: Admin panel (requires Super Admin role)
/groups: Group management (requires Group Admin+ role)


server.js: Main application entry point
dataManager.js: JSON file data persistence
routes/auth.js: Authentication endpoints
routes/users.js: User management endpoints
routes/groups.js: Group management endpoints
routes/channels.js: Channel management endpoints

Global Variables

dataManager: Singleton instance for data operations
PORT: Server port configuration (3000)

REST API Routes
Authentication Routes (/api/auth)
POST /api/auth/login

Purpose: User authentication
Parameters: { username: string, password: string }
Returns: { success: boolean, user?: User, message: string }

POST /api/auth/register

Purpose: Create new user (Super Admin only)
Parameters: { username: string, email: string, password: string, roles?: string[] }
Returns: { success: boolean, user?: User, message: string }

User Management Routes (/api/users)
GET /api/users

Purpose: Get all users (Super Admin only)
Parameters: None
Returns: User[]

GET /api/users/:id

Purpose: Get specific user
Parameters: id (URL parameter)
Returns: User

PUT /api/users/:id

Purpose: Update user (role changes, etc.)
Parameters: id (URL parameter), Partial<User> (body)
Returns: User

DELETE /api/users/:id

Purpose: Delete user
Parameters: id (URL parameter)
Returns: { message: string }

Group Management Routes (/api/groups)
GET /api/groups

Purpose: Get all groups for current user
Parameters: None
Returns: Group[]

POST /api/groups

Purpose: Create new group
Parameters: { name: string, description: string }
Returns: Group

Client-Server Interaction
Authentication Flow

User submits credentials via LoginComponent
AuthService sends POST to /api/auth/login
Server validates credentials against JSON data
Success: Server returns user object, client stores in localStorage
AuthService updates BehaviorSubject, triggers navigation to dashboard
Dashboard loads user-specific data based on roles

Data Persistence

Server: JSON file storage with automatic save after each operation
Client: localStorage for user session persistence
Data synchronization through HTTP requests on component initialization

Role-Based UI Updates

AuthService provides role checking methods
Components use *ngIf with role checks to show/hide features
Route guards prevent unauthorized access
Dashboard dynamically loads admin panels based on user roles
#####
## REST API Routes (Continued)

### Channel Management Routes (/api/channels)
- GET: Get all channels
- POST: Create new channel
- PUT: Update channel
- DELETE: Delete channel

### Image Routes (/api/images) - Phase 2
**POST /api/images/avatar**
- Purpose: Upload user avatar image
- Parameters: FormData with 'avatar' file
- Returns: `{ success: boolean, avatarPath: string }`
- Authentication: Required

**POST /api/images/chat**
- Purpose: Upload image for chat message
- Parameters: FormData with 'image' file
- Returns: `{ success: boolean, imagePath: string }`
- Authentication: Required

## Socket.io Events (Updated for Phase 2)

**Client → Server:**
- `join-channel`: Join a channel
  - Data: `{ channelId, userId, username }`
  - Response: Server sends `message-history` event with recent messages
- `send-message`: Send a message
  - Data: `{ channelId, userId, username, content, imageUrl? }`
- `share-peer-id`: Share PeerJS ID for video calls
  - Data: `{ channelId, peerId }`
- `leave-channel`: Leave a channel
  - Data: `{ channelId }`

**Server → Client:**
- `message-history`: Recent messages when joining channel (last 50)
  - Data: Array of message objects
- `new-message`: New message broadcast
  - Data: Message object
- `user-joined`: User joined notification
  - Data: `{ username, message }`
- `user-left`: User left notification
  - Data: `{ username, message }`
- `peer-id-shared`: Another user's PeerJS ID for video calls
  - Data: `{ username, peerId }`

## Phase 2 Features

### MongoDB Integration
- Replaced JSON file storage with MongoDB (native driver, no Mongoose)
- Database: VidChatApp
- Collections: users, groups, channels, messages
- Connection: Uses MONGODB_URL environment variable

### Socket.io Chat with Message History
- Real-time chat messaging via Socket.io
- Message history loaded when joining channel (last 50 messages)
- Messages stored in MongoDB for persistence
- Support for text and image messages

### PeerJS Video Chat
- WebRTC video chat using PeerJS
- Server: ExpressPeerServer at /peerjs path
- Client: PeerJS client library in Angular
- Supports 2-person video calls within channels
- Peer signaling through Socket.io events

### Image Upload
- Avatar images for user profiles
- Images can be sent as chat messages
- Stored in server/uploads/ directory
- Paths stored in MongoDB
- Max upload size: 5MB
- Allowed formats: JPEG, JPG, PNG, GIF

## Installation & Running

### Server Setup (ELF Server)
```bash
cd /var/www/html/VIDCHAT/server
npm install
export MONGODB_URL="mongodb://localhost:27017"
mkdir -p uploads
npm start
```

Server runs at: https://s5414889.elf.ict.griffith.edu.au/VIDCHAT/server/

### Frontend Setup (Local Development)
```bash
cd client/chat-app
npm install
ng serve --ssl
```

Access at: https://localhost:4200

### Testing Between Two Devices
1. Run frontend on your PC: `ng serve --ssl --host 0.0.0.0`
2. Find your PC's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. On phone/other device, navigate to: `https://[YOUR-PC-IP]:4200`
4. Accept SSL certificate warning
5. Both devices connect to deployed server at ELF
6. Login with different users on each device
7. Join same channel and test video chat

## Testing

### Server Tests
```bash
cd server
npm test
```

### Angular Tests
```bash
cd client/chat-app
ng test --watch=false
```

### E2E Tests
```bash
cd client/chat-app
ng e2e
```

## Technology Stack

### Backend (Phase 2)
- Node.js with Express
- MongoDB (native driver)
- Socket.io for real-time chat
- PeerJS (ExpressPeerServer) for video chat
- Multer for file uploads
- HTTPS with SSL certificates

### Frontend
- Angular 20.2.0
- PeerJS client for WebRTC
- Socket.io-client for real-time communication
- Bootstrap 5.3.8 for styling

## Assignment Due Date
8am Wednesday 08 October 2025
