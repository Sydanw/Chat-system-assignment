import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Group } from '../../models/group.model';
import { Channel } from '../../models/channel.model';
import { User } from '../../models/user.model';
import { GroupService } from '../../services/group.service';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-management.html',
  styleUrl: './group-management.css'
})
export class GroupManagement implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() selectedGroup: Group | null = null;
  @Input() channels: Channel[] = [];

  newChannelName: string = '';
  newChannelDescription: string = '';

  constructor(
    private groupService: GroupService,
    private channelService: ChannelService
  ) {}

  ngOnInit(): void {
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
          console.log('Channel created successfully');
          this.newChannelName = '';
          this.newChannelDescription = '';
        },
        error: (error) => {
          console.error('Error creating channel:', error);
        }
      });
    }
  }

  deleteChannel(channel: Channel): void {
    this.channelService.deleteChannel(channel.id).subscribe({
      next: () => {
        console.log('Channel deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting channel:', error);
      }
    });
  }

  addUserToGroup(userId: number): void {
    if (this.selectedGroup) {
      this.groupService.addUserToGroup(this.selectedGroup.id, userId).subscribe({
        next: () => {
          console.log('User added to group successfully');
        },
        error: (error) => {
          console.error('Error adding user to group:', error);
        }
      });
    }
  }

  removeUserFromGroup(userId: number): void {
    if (this.selectedGroup) {
      this.groupService.removeUserFromGroup(this.selectedGroup.id, userId).subscribe({
        next: () => {
          console.log('User removed from group successfully');
        },
        error: (error) => {
          console.error('Error removing user from group:', error);
        }
      });
    }
  }
}
