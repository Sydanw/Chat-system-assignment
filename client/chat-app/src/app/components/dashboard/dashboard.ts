import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { ChannelService } from '../../services/channel.service';
import { SessionService } from '../../services/session.service';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';
import { AdminPanel } from '../admin-panel/admin-panel';
import { GroupManagement } from '../group-management/group-management';
import { ChannelView } from '../channel-view/channel-view';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPanel, GroupManagement, ChannelView],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  users: any[] = [];
  groups: any[] = [];
  channels: any[] = [];
  messages: any[] = [];
  joinRequests: any[] = [];
  
  selectedGroup: any = null;
  selectedChannel: any = null;
  messageText: string = '';
  
  totalUsers: number = 0;
  totalGroups: number = 0;
  totalChannels: number = 0;
  onlineMembers: number = 15;
  
  showCreateUserForm: boolean = false;
  newUser: any = {
    username: '',
    email: '',
    password: ''
  };
  
  private messagesSubscription: Subscription = new Subscription();
  private connectedSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private groupService: GroupService,
    private channelService: ChannelService,
    private sessionService: SessionService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.getCurrentUser();
    this.sessionService.startSession();
    this.loadInitialData();
    this.initializeSocket();
  }

  ngOnDestroy(): void {
    this.messagesSubscription.unsubscribe();
    this.connectedSubscription.unsubscribe();
    if (this.selectedChannel) {
      this.socketService.leaveChannel(this.selectedChannel.id);
    }
    this.socketService.disconnect();
  }

  loadInitialData(): void {
    this.loadGroups();
    this.loadChannels();
    this.loadMessages();
    
    if (this.isSuperAdmin()) {
      this.loadUsers();
      this.loadSystemStats();
    }
    
    if (this.isGroupAdmin()) {
      this.loadJoinRequests();
    }
  }

  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: any) => {
        this.users = users;
        this.totalUsers = users.length;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.users = this.getDefaultUsers();
      }
    });
  }

  loadGroups(): void {
    this.groupService.getAllGroups().subscribe({
      next: (groups: any) => {
        this.groups = groups || this.getDefaultGroups();
        this.totalGroups = this.groups.length;
      },
      error: (error: any) => {
        console.error('Error loading groups:', error);
        this.groups = this.getDefaultGroups();
      }
    });
  }

  loadChannels(): void {
    this.channelService.getAllChannels().subscribe({
      next: (channels: any) => {
        this.channels = channels || this.getDefaultChannels();
        this.totalChannels = this.channels.length;
      },
      error: (error: any) => {
        console.error('Error loading channels:', error);
        this.channels = this.getDefaultChannels();
      }
    });
  }

  loadMessages(): void {
    if (this.selectedChannel) {
      this.loadMessagesForChannel(this.selectedChannel.id);
    } else {
      this.messages = this.getDefaultMessages();
    }
  }

  initializeSocket(): void {
    this.messagesSubscription = this.socketService.messages$.subscribe(messages => {
      this.messages = this.limitMessages(messages);
      setTimeout(() => this.scrollToBottom(), 100);
    });

    this.connectedSubscription = this.socketService.connected$.subscribe(connected => {
      if (connected && this.selectedChannel) {
        this.socketService.joinChannel(this.selectedChannel.id);
      }
    });
  }

  loadJoinRequests(): void {
    this.joinRequests = [
      { username: 'new_user', userId: 4, groupId: 1 }
    ];
  }

  loadSystemStats(): void {
    this.totalUsers = this.users.length || 25;
    this.totalGroups = this.groups.length || 8;
    this.totalChannels = this.channels.length || 15;
  }

  getDefaultUsers(): any[] {
    return [
      { id: 1, username: 'super', roles: ['Super Admin'] },
      { id: 2, username: 'group_admin', roles: ['Group Admin'] },
      { id: 3, username: 'john_doe', roles: ['User'] }
    ];
  }

  getDefaultGroups(): any[] {
    if (this.isSuperAdmin()) {
      return [
        { id: 1, name: 'General Discussion', isOwner: false },
        { id: 2, name: 'Development Team', isOwner: false },
        { id: 3, name: 'Marketing', isOwner: false }
      ];
    } else if (this.isGroupAdmin()) {
      return [
        { id: 2, name: 'Development Team', isOwner: true },
        { id: 4, name: 'Project Alpha', isOwner: false }
      ];
    } else {
      return [
        { id: 1, name: 'General Discussion', isOwner: false },
        { id: 4, name: 'Project Alpha', isOwner: false },
        { id: 5, name: 'Casual Chat', isOwner: false }
      ];
    }
  }

  getDefaultChannels(): any[] {
    if (this.isSuperAdmin()) {
      return [
        { id: 1, name: 'general', groupId: 1 },
        { id: 2, name: 'announcements', groupId: 1 },
        { id: 3, name: 'random', groupId: 1 }
      ];
    } else if (this.isGroupAdmin()) {
      return [
        { id: 4, name: 'dev-general', groupId: 2 },
        { id: 5, name: 'code-review', groupId: 2 },
        { id: 6, name: 'testing', groupId: 2 }
      ];
    } else {
      return [
        { id: 1, name: 'general', groupId: 1 },
        { id: 7, name: 'help', groupId: 1 },
        { id: 3, name: 'random', groupId: 1 }
      ];
    }
  }

  getDefaultMessages(): any[] {
    if (this.isSuperAdmin()) {
      return [
        { username: 'john_doe', content: 'Hello everyone!', timestamp: new Date() },
        { username: 'admin_user', content: 'Welcome to the channel', timestamp: new Date() },
        { username: 'super', content: 'System running smoothly', timestamp: new Date() }
      ];
    } else if (this.isGroupAdmin()) {
      return [
        { username: 'developer1', content: 'Working on the new feature', timestamp: new Date() },
        { username: 'group_admin', content: 'Great progress team!', timestamp: new Date() },
        { username: 'tester2', content: 'Found a bug in module X', timestamp: new Date() }
      ];
    } else {
      return [
        { username: 'alice', content: 'Good morning everyone!', timestamp: new Date() },
        { username: 'bob', content: 'Has anyone seen the latest update?', timestamp: new Date() },
        { username: 'charlie', content: 'Yes, looks great!', timestamp: new Date() },
        { username: 'john_doe', content: 'I agree, very impressed', timestamp: new Date() }
      ];
    }
  }

  selectGroup(group: any): void {
    this.selectedGroup = group;
    this.loadChannelsForGroup(group.id);
  }

  selectChannel(channel: any): void {
    if (this.selectedChannel) {
      this.socketService.leaveChannel(this.selectedChannel.id);
    }
    
    this.selectedChannel = channel;
    this.socketService.clearMessages();
    this.loadMessagesForChannel(channel.id);
    this.socketService.joinChannel(channel.id);
  }

  loadChannelsForGroup(groupId: number): void {
    this.channelService.getChannelsByGroupId(groupId).subscribe({
      next: (channels: any) => {
        this.channels = channels || this.getDefaultChannels().filter(c => c.groupId === groupId);
      },
      error: (error: any) => {
        console.error('Error loading channels for group:', error);
        this.channels = this.getDefaultChannels().filter(c => c.groupId === groupId);
      }
    });
  }

  loadMessagesForChannel(channelId: number): void {
    this.channelService.getMessagesForChannel(channelId).subscribe({
      next: (messages: any[]) => {
        this.socketService.setMessages(messages);
      },
      error: (error: any) => {
        console.error('Error loading messages for channel:', error);
        this.socketService.setMessages(this.getDefaultMessages());
      }
    });
  }

  sendMessage(): void {
    if (this.messageText.trim() && this.selectedChannel) {
      this.socketService.sendMessage(this.selectedChannel.id, this.messageText);
      this.messageText = '';
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  logout(): void {
    this.sessionService.endSession();
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  isGroupAdmin(): boolean {
    return this.authService.isGroupAdmin();
  }

  getRoleText(): string {
    if (this.isSuperAdmin()) return 'Super Admin';
    if (this.isGroupAdmin()) return 'Group Admin';
    return 'User';
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  limitMessages(messages: any[]): any[] {
    if (messages.length > 100) {
      return messages.slice(-100);
    }
    return messages;
  }

  scrollToBottom(): void {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      alert('Please fill in all fields');
      return;
    }
    
    this.userService.createUser(this.newUser).subscribe({
      next: (response: any) => {
        console.log('User created successfully:', response);
        this.loadUsers();
        this.cancelCreateUser();
        alert('User created successfully!');
      },
      error: (error: any) => {
        console.error('Error creating user:', error);
        alert(error.error?.message || 'Failed to create user');
      }
    });
  }
  
  cancelCreateUser(): void {
    this.showCreateUserForm = false;
    this.newUser = { username: '', email: '', password: '' };
  }

  removeUser(user: any): void {
    if (confirm(`Are you sure you want to remove user ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          console.log('User removed successfully');
          this.users = this.users.filter(u => u.id !== user.id);
          this.loadSystemStats();
          alert('User removed successfully!');
        },
        error: (error: any) => {
          console.error('Error removing user:', error);
          alert('Failed to remove user');
        }
      });
    }
  }
}
