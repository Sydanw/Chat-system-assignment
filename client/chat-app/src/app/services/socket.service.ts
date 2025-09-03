import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

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
    this.socket = io('http://localhost:3000', {
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

  sendMessage(channelId: number, content: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && content.trim()) {
      this.socket.emit('send-message', {
        channelId: channelId,
        userId: currentUser.id,
        username: currentUser.username,
        content: content.trim()
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
}
