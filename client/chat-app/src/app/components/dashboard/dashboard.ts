import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser && this.authService.isSuperAdmin()) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: any) => {
        this.users = users;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
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

  getRoleText(): string {
    if (this.isSuperAdmin()) return 'Super Admin';
    if (this.isGroupAdmin()) return 'Group Admin';
    return 'User';
  }
}
