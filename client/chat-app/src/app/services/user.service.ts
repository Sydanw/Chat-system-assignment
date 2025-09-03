import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// User Interface (remove duplicate if you have it in models)
export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  groups: number[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  roles?: string[];
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface SystemStats {
  totalUsers: number;
  totalGroups: number;
  activeChannels: number;
  usersByRole: {
    superAdmins: number;
    groupAdmins: number;
    regularUsers: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    // Use environment API URL if available, otherwise fallback to localhost
    this.apiUrl = environment.apiUrl ? `${environment.apiUrl}/users` : 'http://localhost:3000/api/users';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.error?.message || error.message || 'Server error';
    }
    console.error('UserService Error:', error);
    return throwError(() => errorMessage);
  }

  // Get all users (Super Admin only)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Get user by ID (Super Admin only)
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Create new user (Super Admin only)
  createUser(userData: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, userData, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Update user (Super Admin only)
  updateUser(id: number, userData: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, userData, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Delete user (Super Admin only)
  deleteUser(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Promote user to Group Admin (Super Admin only)
  promoteToGroupAdmin(id: number): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${id}/promote-group-admin`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Promote user to Super Admin (Super Admin only)
  promoteToSuperAdmin(id: number): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${id}/promote-super-admin`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Get system statistics (Super Admin only)
  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.apiUrl}/stats/overview`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // Helper method to check if user has specific role
  hasRole(user: User, role: string): boolean {
    return user.roles && user.roles.includes(role);
  }

  // Helper method to get role display name
  getRoleDisplayNames(roles: string[]): string {
    if (roles.includes('Super Admin')) {
      return 'Super Admin';
    } else if (roles.includes('Group Admin')) {
      return 'Group Admin';
    } else {
      return 'User';
    }
  }

  // Helper method to check if user is Super Admin
  isSuperAdmin(user: User): boolean {
    return this.hasRole(user, 'Super Admin');
  }

  // Helper method to check if user is Group Admin
  isGroupAdmin(user: User): boolean {
    return this.hasRole(user, 'Group Admin');
  }

  // Helper method to check if user is regular user
  isRegularUser(user: User): boolean {
    return this.hasRole(user, 'User') && 
           !this.hasRole(user, 'Super Admin') && 
           !this.hasRole(user, 'Group Admin');
  }

  // Get user's highest role priority (for sorting/display)
  getUserRolePriority(user: User): number {
    if (this.hasRole(user, 'Super Admin')) return 3;
    if (this.hasRole(user, 'Group Admin')) return 2;
    return 1; // Regular User
  }

  // Format user roles for display
  formatUserRoles(roles: string[]): string {
    if (!roles || roles.length === 0) return 'No roles';
    
    const priorityRoles = ['Super Admin', 'Group Admin', 'User'];
    const sortedRoles = roles.sort((a, b) => {
      return priorityRoles.indexOf(a) - priorityRoles.indexOf(b);
    });
    
    return sortedRoles.join(', ');
  }
}