# Chat System Assignment - Phase 1

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


## Data Structures

### Users
```javascript
{
  id: number,
  username: string,
  email: string,
  password: string,
  roles: string[],        // ['User', 'Group Admin', 'Super Admin']
  groups: number[]        // Array of group IDs user belongs to
}

##Groups
{
  id: number,
  name: string,
  description: string,
  createdBy: number,      // User ID of creator
  members: number[],      // Array of user IDs
  admins: number[],       // Array of user IDs with admin rights
  channels: number[]      // Array of channel IDs
}

##Channels
{
  id: number,
  name: string,
  groupId: number,
  description: string
}

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
