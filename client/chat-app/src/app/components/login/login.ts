import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loginError: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
    }
  }

  login(): void {
    if (!this.username || !this.password) {
      this.loginError = 'Username and password are required';
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    console.log('Attempting login with:', { username: this.username, password: this.password });

    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: (success) => {
          console.log('Login response:', success);
          this.isLoading = false;
          if (success) {
            this.redirectBasedOnRole();
          } else {
            this.loginError = 'Login failed. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          this.loginError = error.error?.message || 'Login failed. Please check your connection.';
        }
      });
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
    if (user) {
      // For now, just navigate to a simple success page
      alert(`Welcome ${user.username}! Role: ${user.roles.join(', ')}`);
      // Later you can navigate to different dashboards based on role
    }
  }

  // Test connection to backend
  testConnection(): void {
    console.log('Testing connection to backend...');
    fetch('http://localhost:3000/api/users')
      .then(response => {
        console.log('Backend response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Backend data:', data);
        alert('Backend connection successful! Check console for details.');
      })
      .catch(error => {
        console.error('Connection test failed:', error);
        alert('Backend connection failed! Check console for details.');
      });
  }
}