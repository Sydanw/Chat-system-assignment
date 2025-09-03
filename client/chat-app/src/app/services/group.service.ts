import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group } from '../models/group.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor(private http: HttpClient) {}

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${environment.apiUrl}/groups`);
  }

  getGroupById(id: number): Observable<Group> {
    return this.http.get<Group>(`${environment.apiUrl}/groups/${id}`);
  }

  createGroup(group: Partial<Group>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/groups`, group);
  }

  updateGroup(id: number, updates: Partial<Group>): Observable<Group> {
    return this.http.put<Group>(`${environment.apiUrl}/groups/${id}`, updates);
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/groups/${id}`);
  }

  addUserToGroup(groupId: number, userId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/groups/${groupId}/members`, { userId });
  }

  removeUserFromGroup(groupId: number, userId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/groups/${groupId}/members/${userId}`);
  }
}
