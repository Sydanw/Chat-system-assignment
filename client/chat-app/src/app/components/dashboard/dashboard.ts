import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { ChannelService } from '../../services/channel.service';
import { User } from '../../models/user.model';
import { Group } from '../../models/group.model';
import { Channel } from '../../models/channel.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];
  groups: Group[] = [];
  channels: Channel[] = [];
  selectedGroup: Group | null = null;
  selectedChannel: Channel | null = null;
  messageText: string = '';
  messages: any[] = [];
  newGroupName: string = '';
  newGroupDescription: string = '';
  newChannelName: string = '';
  newChannelDescription: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private groupService: GroupService,
    private channelService: ChannelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.loadGroups();
      if (this.authService.isSuperAdmin()) {
        this.loadUsers();
      }
    }
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadGroups(): void {
    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        if (groups.length > 0 && !this.selectedGroup) {
          this.selectGroup(groups[0]);
        }
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  selectGroup(group: Group): void {
    this.selectedGroup = group;
    this.loadChannelsForGroup(group.id);
  }

  loadChannelsForGroup(groupId: number): void {
    this.channelService.getChannelsByGroupId(groupId).subscribe({
      next: (channels) => {
        this.channels = channels;
        if (channels.length > 0) {
          this.selectChannel(channels[0]);
        } else {
          this.selectedChannel = null;
          this.messages = [];
        }
      },
      error: (error) => {
        console.error('Error loading channels:', error);
      }
    });
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel;
    this.loadMessages();
  }

  loadMessages(): void {
    this.messages = [
      { username: 'john_doe', text: 'Hello everyone!', timestamp: new Date() },
      { username: 'admin_user', text: 'Welcome to the channel', timestamp: new Date() },
      { username: 'super', text: 'System running smoothly', timestamp: new Date() }
    ];
  }

  sendMessage(): void {
    if (this.messageText.trim() && this.currentUser && this.selectedChannel) {
      const newMessage = {
        username: this.currentUser.username,
        text: this.messageText.trim(),
        timestamp: new Date()
      };
      this.messages.push(newMessage);
      this.messageText = '';
    }
  }

  createGroup(): void {
    if (this.newGroupName.trim() && this.currentUser) {
      const groupData = {
        name: this.newGroupName.trim(),
        description: this.newGroupDescription.trim(),
        createdBy: this.currentUser.id
      };
      
      this.groupService.createGroup(groupData).subscribe({
        next: (response) => {
          this.loadGroups();
          this.newGroupName = '';
          this.newGroupDescription = '';
        },
        error: (error) => {
          console.error('Error creating group:', error);
        }
      });
    }
  }

  createChannel(): void {
    if (this.newChannelName.trim() && this.selectedGroup) {
      const channelData = {
        name: this.newChannelName.trim(),
        description: this.newChannelDescription.trim(),
        groupId: this.selectedGroup.id
      };
      
      this.channelService.createChannel(channelData).subscribe({
        next: (response) => {
          this.loadChannelsForGroup(this.selectedGroup!.id);
          this.newChannelName = '';
          this.newChannelDescription = '';
        },
        error: (error) => {
          console.error('Error creating channel:', error);
        }
      });
    }
  }

  promoteToGroupAdmin(user: User): void {
    this.userService.promoteToGroupAdmin(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  promoteToSuperAdmin(user: User): void {
    this.userService.promoteToSuperAdmin(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  removeUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error removing user:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  isGroupAdmin(): boolean {
    return this.authService.isGroupAdmin();
  }

  isRegularUser(): boolean {
    return !this.isSuperAdmin() && !this.isGroupAdmin();
  }

  getRoleBadgeClass(): string {
    if (this.isSuperAdmin()) return 'super-admin';
    if (this.isGroupAdmin()) return 'group-admin';
    return 'user';
  }

  getRoleText(): string {
    if (this.isSuperAdmin()) return 'Super Admin';
    if (this.isGroupAdmin()) return 'Group Admin';
    return 'User';
  }
}
