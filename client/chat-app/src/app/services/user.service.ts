import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, user);
  }

  updateUser(id: number, updates: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/${id}`, updates);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }

  promoteToGroupAdmin(userId: number): Observable<User> {
    return this.updateUser(userId, { roles: ['Group Admin'] });
  }

  promoteToSuperAdmin(userId: number): Observable<User> {
    return this.updateUser(userId, { roles: ['Super Admin'] });
  }
}