# Chat System Assignment - Phase 2

## MongoDB Setup Using MongoDB Atlas (Cloud Database)

Since the ELF server doesn't have sudo access, we use MongoDB Atlas (free cloud-hosted MongoDB) instead of local installation.

### Step 1: Create MongoDB Atlas Account (Already Done ✓)
You've already created your Atlas account and cluster at https://cloud.mongodb.com/

**Your Atlas Credentials:**
- Username: `sydplace1`
- Password: `256811471002613` (⚠️ Keep this secure!)
- Cluster: `vidchatdb`
- Database: `VidChatApp`

### Step 2: Configure IP Whitelist for ELF Server
**CRITICAL:** You must add the ELF server's IP address to MongoDB Atlas Access List, otherwise the server cannot connect.

1. Log into MongoDB Atlas: https://cloud.mongodb.com/
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. You need to find the ELF server's public IP address. SSH into ELF and run:
   ```bash
   curl ifconfig.me
   ```
5. Add this IP address to the Access List in MongoDB Atlas
6. Your current PC IP (132.234.228.114) is already whitelisted for local testing

**Alternatively:** You can whitelist all IPs by adding `0.0.0.0/0` (less secure but simpler for testing)

### Step 3: Connection String
Your MongoDB Atlas connection string:
```
mongodb+srv://sydplace1:256811471002613@vidchatdb.ynrkz3c.mongodb.net/?retryWrites=true&w=majority&appName=vidchatdb
```

The application will automatically create the `VidChatApp` database and collections (users, groups, channels, messages) on first connection.

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

**Prerequisites:**
1. MongoDB Atlas cluster created (✓ Done)
2. ELF server IP added to Atlas Access List (⚠️ Required - see Step 2 above)

**Deployment Steps:**
```bash
ssh s5414889@elf.ict.griffith.edu.au
cd /var/www/html/VIDCHAT/server

npm install

export MONGODB_URL="mongodb+srv://sydplace1:256811471002613@vidchatdb.ynrkz3c.mongodb.net/?retryWrites=true&w=majority&appName=vidchatdb"

mkdir -p uploads

npm start
```

**Important Notes:**
- The `MONGODB_URL` environment variable contains your Atlas connection string
- This environment variable must be set every time you start the server
- Consider adding it to your shell profile (~/.bashrc or ~/.bash_profile) for persistence:
  ```bash
  echo 'export MONGODB_URL="mongodb+srv://sydplace1:256811471002613@vidchatdb.ynrkz3c.mongodb.net/?retryWrites=true&w=majority&appName=vidchatdb"' >> ~/.bashrc
  source ~/.bashrc
  ```
- The database will be automatically initialized with default users on first connection
- Default test users: super/123, group_admin/123, john_doe/123

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
