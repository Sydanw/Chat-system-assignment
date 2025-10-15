import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<any[]>([]);
  private connectedSubject = new BehaviorSubject<boolean>(false);
  
  public messages$ = this.messagesSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectedSubject.next(false);
    });

    this.socket.on('new-message', (message: any) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    this.socket.on('user-joined', (data: any) => {
      console.log(data.message);
    });

    this.socket.on('user-left', (data: any) => {
      console.log(data.message);
    });

    this.socket.on('message-error', (error: any) => {
      console.error('Message error:', error);
    });
  }

  joinChannel(channelId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.socket.emit('join-channel', {
        channelId: channelId,
        userId: currentUser.id,
        username: currentUser.username
      });
    }
  }

  leaveChannel(channelId: number): void {
    this.socket.emit('leave-channel', {
      channelId: channelId
    });
  }

  sendMessage(channelId: number, content: string, imageUrl?: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && (content.trim() || imageUrl)) {
      this.socket.emit('send-message', {
        channelId: channelId,
        userId: currentUser.id,
        username: currentUser.username,
        content: content.trim(),
        imageUrl: imageUrl || null
      });
    }
  }

  setMessages(messages: any[]): void {
    this.messagesSubject.next(messages);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('new-message', (message: Message) => {
        observer.next(message);
      });
    });
  }

  onUserJoined(): Observable<{username: string, message: string}> {
    return new Observable(observer => {
      this.socket.on('user-joined', (data: {username: string, message: string}) => {
        observer.next(data);
      });
    });
  }

  onUserLeft(): Observable<{username: string, message: string}> {
    return new Observable(observer => {
      this.socket.on('user-left', (data: {username: string, message: string}) => {
        observer.next(data);
      });
    });
  }

  registerPeerID(peerID: string, channelId: string | number): void {
    console.log('📡 Registering peer ID:', peerID, 'in channel:', channelId);
    this.socket.emit('share-peer-id', { channelId: channelId.toString(), peerId: peerID });
  }

  onPeerIDAvailable(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('peer-id-shared', (data: {username: string, peerId: string}) => {
        console.log('📡 Received peer-id-shared event:', data);
        observer.next(data.peerId);
      });
    });
  }

  onMessageHistory(): Observable<Message[]> {
    return new Observable(observer => {
      this.socket.on('message-history', (messages: Message[]) => {
        observer.next(messages);
      });
    });
  }
}
