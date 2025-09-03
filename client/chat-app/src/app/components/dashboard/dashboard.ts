import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { ChannelService } from '../../services/channel.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
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

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private groupService: GroupService,
    private channelService: ChannelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.getCurrentUser();
    this.loadInitialData();
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
    this.messages = this.getDefaultMessages();
  }

  loadJoinRequests(): void {
    this.joinRequests = [
      { username: 'new_user', groupId: 1 }
    ];
  }

  loadSystemStats(): void {
    this.totalUsers = this.users.length || 25;
    this.totalGroups = this.groups.length || 8;
    this.totalChannels = this.channels.length || 15;
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
        { username: 'john_doe', content: 'Hello everyone!' },
        { username: 'admin_user', content: 'Welcome to the channel' },
        { username: 'super', content: 'System running smoothly' }
      ];
    } else if (this.isGroupAdmin()) {
      return [
        { username: 'developer1', content: 'Working on the new feature' },
        { username: 'group_admin', content: 'Great progress team!' },
        { username: 'tester2', content: 'Found a bug in module X' }
      ];
    } else {
      return [
        { username: 'alice', content: 'Good morning everyone!' },
        { username: 'bob', content: 'Has anyone seen the latest update?' },
        { username: 'charlie', content: 'Yes, looks great!' },
        { username: 'john_doe', content: 'I agree, very impressed' }
      ];
    }
  }

  selectGroup(group: any): void {
    this.selectedGroup = group;
  }

  selectChannel(channel: any): void {
    this.selectedChannel = channel;
  }

  sendMessage(): void {
    if (this.messageText.trim()) {
      this.messages.push({
        username: this.currentUser?.username || 'You',
        content: this.messageText
      });
      this.messageText = '';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
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
}
