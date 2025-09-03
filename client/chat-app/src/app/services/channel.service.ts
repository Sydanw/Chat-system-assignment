import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Channel } from '../models/channel.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  constructor(private http: HttpClient) {}

  getAllChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${environment.apiUrl}/channels`);
  }

  getChannelsByGroupId(groupId: number): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${environment.apiUrl}/channels/group/${groupId}`);
  }

  getChannelById(id: number): Observable<Channel> {
    return this.http.get<Channel>(`${environment.apiUrl}/channels/${id}`);
  }

  createChannel(channel: Partial<Channel>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/channels`, channel);
  }

  updateChannel(id: number, updates: Partial<Channel>): Observable<Channel> {
    return this.http.put<Channel>(`${environment.apiUrl}/channels/${id}`, updates);
  }

  deleteChannel(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/channels/${id}`);
  }

  addUserToChannel(channelId: number, userId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/channels/${channelId}/members`, { userId });
  }

  removeUserFromChannel(channelId: number, userId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/channels/${channelId}/members/${userId}`);
  }

  getMessagesForChannel(channelId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/channels/${channelId}/messages`);
  }
}
