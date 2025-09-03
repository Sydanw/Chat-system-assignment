import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Group } from '../../models/group.model';
import { Channel } from '../../models/channel.model';
import { UserService, CreateUserRequest, SystemStats } from '../../services/user.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel implements OnInit {
  // Data properties - now managed internally instead of @Input
  currentUser: User | null = null;
  users: User[] = [];
  groups: Group[] = [];
  channels: Channel[] = [];
  systemStats: SystemStats | null = null;
  
  // Loading and state management
  loading = false;
  error = '';
  successMessage = '';
  
  // User creation form
  showCreateUserForm = false;
  newUser: CreateUserRequest = {
    username: '',
    email: '',
    password: '123',
    roles: ['User']
  };
  
  // Form validation
  createUserFormErrors: any = {};
  
  // Available roles for dropdown
  availableRoles = [
    { value: 'User', label: 'User' },
    { value: 'Group Admin', label: 'Group Admin' },
    { value: 'Super Admin', label: 'Super Admin' }
  ];

  constructor(
    private userService: UserService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // Load initial data
  loadInitialData(): void {
    this.loadUsers();
    this.loadSystemStats();
    this.loadGroups();
    this.loadChannels();
  }

  // Load all users
  loadUsers(): void {
    this.loading = true;
    this.clearMessages();
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) => {
          // Sort by role priority first, then by username
          const priorityDiff = this.userService.getUserRolePriority(b) - this.userService.getUserRolePriority(a);
          if (priorityDiff !== 0) return priorityDiff;
          return a.username.localeCompare(b.username);
        });
        this.loading = false;
      },
      error: (error) => {
        this.showError(`Failed to load users: ${error}`);
        this.loading = false;
      }
    });
  }

  // Load system statistics
  loadSystemStats(): void {
    this.userService.getSystemStats().subscribe({
      next: (stats) => {
        this.systemStats = stats;
      },
      error: (error) => {
        console.error('Failed to load system stats:', error);
        // Don't show error for stats, it's not critical
      }
    });
  }

  // Load groups (if you have a method for this)
  loadGroups(): void {
    // If your GroupService has a getAllGroups method, use it
    // Otherwise, we'll use the systemStats for group count
    try {
      if (this.groupService && typeof (this.groupService as any).getAllGroups === 'function') {
        (this.groupService as any).getAllGroups().subscribe({
          next: (groups: Group[]) => {
            this.groups = groups;
          },
          error: (error: any) => {
            console.error('Failed to load groups:', error);
          }
        });
      }
    } catch (error) {
      // If no getAllGroups method exists, that's okay
      console.log('Groups will be shown via system stats');
    }
  }

  // Load channels (if you have a method for this)
  loadChannels(): void {
    // If your service has a getAllChannels method, use it
    // Otherwise, we'll use the systemStats for channel count
    try {
      if (typeof (this.groupService as any).getAllChannels === 'function') {
        (this.groupService as any).getAllChannels().subscribe({
          next: (channels: Channel[]) => {
            this.channels = channels;
          },
          error: (error: any) => {
            console.error('Failed to load channels:', error);
          }
        });
      }
    } catch (error) {
      // If no getAllChannels method exists, that's okay
      console.log('Channels will be shown via system stats');
    }
  }

  // Validate create user form
  validateCreateUserForm(): boolean {
    this.createUserFormErrors = {};
    let isValid = true;

    // Username validation
    if (!this.newUser.username || this.newUser.username.trim().length === 0) {
      this.createUserFormErrors.username = 'Username is required';
      isValid = false;
    } else if (this.newUser.username.trim().length < 3) {
      this.createUserFormErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    } else if (this.users.some(user => user.username.toLowerCase() === this.newUser.username.trim().toLowerCase())) {
      this.createUserFormErrors.username = 'Username already exists';
      isValid = false;
    }

    // Email validation
    if (!this.newUser.email || this.newUser.email.trim().length === 0) {
      this.createUserFormErrors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.newUser.email.trim())) {
        this.createUserFormErrors.email = 'Please enter a valid email address';
        isValid = false;
      } else if (this.users.some(user => user.email.toLowerCase() === this.newUser.email.trim().toLowerCase())) {
        this.createUserFormErrors.email = 'Email already exists';
        isValid = false;
      }
    }

    // Password validation
    if (this.newUser.password && this.newUser.password.length < 3) {
      this.createUserFormErrors.password = 'Password must be at least 3 characters';
      isValid = false;
    }

    return isValid;
  }

  // Create new user
  createUser(): void {
    if (!this.validateCreateUserForm()) {
      this.showError('Please fix the form errors before submitting');
      return;
    }

    this.loading = true;
    this.clearMessages();

    // Prepare user data
    const userData: CreateUserRequest = {
      username: this.newUser.username.trim(),
      email: this.newUser.email.trim(),
      password: this.newUser.password || '123',
      roles: this.newUser.roles || ['User']
    };

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        this.showSuccess(`User "${response.user.username}" created successfully`);
        this.loadUsers();
        this.loadSystemStats();
        this.resetCreateForm();
        this.loading = false;
      },
      error: (error) => {
        this.showError(`Failed to create user: ${error}`);
        this.loading = false;
      }
    });
  }

  // Promote user to Group Admin (updated to use new API)
  promoteToGroupAdmin(user: User): void {
    if (this.userService.hasRole(user, 'Group Admin')) {
      this.showError('User is already a Group Admin');
      return;
    }

    const confirmation = confirm(
      `Promote "${user.username}" to Group Admin?\n\n` +
      `This will give them the ability to:\n` +
      `- Create and manage groups\n` +
      `- Add/remove group members\n` +
      `- Moderate group discussions`
    );

    if (!confirmation) return;

    this.loading = true;
    this.clearMessages();

    this.userService.promoteToGroupAdmin(user.id).subscribe({
      next: (response) => {
        this.showSuccess(`User "${user.username}" promoted to Group Admin successfully`);
        this.loadUsers();
        this.loadSystemStats();
        this.loading = false;
      },
      error: (error) => {
        this.showError(`Failed to promote user: ${error}`);
        this.loading = false;
      }
    });
  }

  // Promote user to Super Admin (updated to use new API)
  promoteToSuperAdmin(user: User): void {
    if (this.userService.hasRole(user, 'Super Admin')) {
      this.showError('User is already a Super Admin');
      return;
    }

    const confirmation = confirm(
      `⚠️ PROMOTE "${user.username}" TO SUPER ADMIN? ⚠️\n\n` +
      `This will give them FULL SYSTEM ACCESS including:\n` +
      `- Create/delete ANY user\n` +
      `- Access ALL groups and channels\n` +
      `- Modify system settings\n` +
      `- Promote/demote other users\n\n` +
      `This action should only be taken for trusted administrators.\n\n` +
      `Are you absolutely sure?`
    );

    if (!confirmation) return;

    this.loading = true;
    this.clearMessages();

    this.userService.promoteToSuperAdmin(user.id).subscribe({
      next: (response) => {
        this.showSuccess(`User "${user.username}" promoted to Super Admin successfully`);
        this.loadUsers();
        this.loadSystemStats();
        this.loading = false;
      },
      error: (error) => {
        this.showError(`Failed to promote user: ${error}`);
        this.loading = false;
      }
    });
  }

  // Remove user (updated with better error handling)
  removeUser(user: User): void {
    const confirmation = confirm(
      `Are you sure you want to delete user "${user.username}"?\n\n` +
      `This action cannot be undone and will:\n` +
      `- Remove the user from all groups\n` +
      `- Delete all their chat history\n` +
      `- Revoke all their permissions`
    );

    if (!confirmation) return;

    this.loading = true;
    this.clearMessages();

    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        this.showSuccess(`User "${user.username}" deleted successfully`);
        this.loadUsers();
        this.loadSystemStats();
        this.loading = false;
      },
      error: (error) => {
        this.showError(`Failed to delete user: ${error}`);
        this.loading = false;
      }
    });
  }

  // Toggle create user form
  toggleCreateForm(): void {
    this.showCreateUserForm = !this.showCreateUserForm;
    if (!this.showCreateUserForm) {
      this.resetCreateForm();
    }
    this.clearMessages();
  }

  // Reset create user form
  resetCreateForm(): void {
    this.newUser = {
      username: '',
      email: '',
      password: '123',
      roles: ['User']
    };
    this.createUserFormErrors = {};
    this.showCreateUserForm = false;
  }

  // Update selected role for new user
  onRoleChange(event: any): void {
    this.newUser.roles = [event.target.value];
  }

  // Get user role display
  getUserRoleDisplay(user: User): string {
    return this.userService.getRoleDisplayNames(user.roles);
  }

  // Get user role badge class
  getUserRoleBadgeClass(user: User): string {
    const role = this.getUserRoleDisplay(user);
    return `role-badge role-${role.toLowerCase().replace(' ', '-')}`;
  }

  // Check if user can be promoted to Group Admin
  canPromoteToGroupAdmin(user: User): boolean {
    return !this.userService.hasRole(user, 'Group Admin') && 
           !this.userService.hasRole(user, 'Super Admin');
  }

  // Check if user can be promoted to Super Admin
  canPromoteToSuperAdmin(user: User): boolean {
    return !this.userService.hasRole(user, 'Super Admin');
  }

  // Get role class (your existing method, enhanced)
  getRoleClass(roles: string[]): string {
    if (roles.includes('Super Admin')) return 'super-admin';
    if (roles.includes('Group Admin')) return 'group-admin';
    return 'user';
  }

  // Get total counts (enhanced with fallback to systemStats)
  getTotalUsers(): number {
    return this.systemStats?.totalUsers || this.users.length;
  }

  getTotalGroups(): number {
    return this.systemStats?.totalGroups || this.groups.length;
  }

  getTotalChannels(): number {
    return this.systemStats?.activeChannels || this.channels.length;
  }

  // Refresh all data
  refreshData(): void {
    this.clearMessages();
    this.loadInitialData();
  }

  // Show error message
  private showError(message: string): void {
    this.error = message;
    this.successMessage = '';
    setTimeout(() => {
      this.error = '';
    }, 7000);
  }

  // Show success message
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.error = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  // Clear all messages
  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  // Get form field error
  getFieldError(fieldName: string): string {
    return this.createUserFormErrors[fieldName] || '';
  }

  // Check if field has error
  hasFieldError(fieldName: string): boolean {
    return !!this.createUserFormErrors[fieldName];
  }

  // Track by function for ngFor performance
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  // Check if current user is super admin (helper method)
  get isSuperAdmin(): boolean {
    return this.currentUser ? this.userService.isSuperAdmin(this.currentUser) : false;
  }
}