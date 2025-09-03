import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Group } from '../../models/group.model';
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
  @Input() isSuperAdmin: boolean = false;

  constructor(
    private userService: UserService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
  }

  promoteToGroupAdmin(user: User): void {
    this.userService.promoteToGroupAdmin(user.id).subscribe({
      next: () => {
        console.log('User promoted to Group Admin');
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  promoteToSuperAdmin(user: User): void {
    this.userService.promoteToSuperAdmin(user.id).subscribe({
      next: () => {
        console.log('User promoted to Super Admin');
      },
      error: (error) => {
        console.error('Error promoting user:', error);
      }
    });
  }

  removeUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        console.log('User removed');
      },
      error: (error) => {
        console.error('Error removing user:', error);
      }
    });
  }
}
