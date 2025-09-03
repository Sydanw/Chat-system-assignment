import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Group } from '../../models/group.model';
import { Channel } from '../../models/channel.model';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() users: User[] = [];
  @Input() groups: Group[] = [];
  @Input() channels: Channel[] = [];
  @Input() isSuperAdmin: boolean = false;

  constructor(
    private userService: UserService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
  }

  promoteToGroupAdmin(user: User): void {
    const updatedRoles = [...user.roles, 'Group Admin'];
    this.userService.updateUser(user.id, { roles: updatedRoles }).subscribe({
      next: () => {
        console.log('User promoted to Group Admin');
        user.roles = updatedRoles;
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  promoteToSuperAdmin(user: User): void {
    const updatedRoles = [...user.roles, 'Super Admin'];
    this.userService.updateUser(user.id, { roles: updatedRoles }).subscribe({
      next: () => {
        console.log('User promoted to Super Admin');
        user.roles = updatedRoles;
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  removeUser(user: User): void {
    if (confirm(`Are you sure you want to remove user ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          console.log('User removed');
          this.users = this.users.filter(u => u.id !== user.id);
        },
        error: (error) => {
          console.error('Error removing user:', error);
        }
      });
    }
  }

  getRoleClass(roles: string[]): string {
    if (roles.includes('Super Admin')) return 'super-admin';
    if (roles.includes('Group Admin')) return 'group-admin';
    return 'user';
  }

  getTotalUsers(): number {
    return this.users.length;
  }

  getTotalGroups(): number {
    return this.groups.length;
  }

  getTotalChannels(): number {
    return this.channels.length;
  }
}
