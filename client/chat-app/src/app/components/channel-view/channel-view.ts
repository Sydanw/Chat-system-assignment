import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Channel } from '../../models/channel.model';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';
import { SocketService } from '../../services/socket.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-channel-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-view.html',
  styleUrl: './channel-view.css'
})
export class ChannelView implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  @Input() selectedChannel: Channel | null = null;
  @Input() currentUser: User | null = null;
  @Input() onlineMembers: number = 0;
  
  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  messages: Message[] = [];
  messageText: string = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  uploadingImage: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.socketService.onMessage().subscribe((message: Message) => {
        this.messages.push(message);
        console.log('Received message:', message);
      })
    );

    this.subscriptions.push(
      this.socketService.onMessageHistory().subscribe((messages: Message[]) => {
        this.messages = messages;
        console.log('Loaded message history:', messages.length, 'messages');
      })
    );

    this.subscriptions.push(
      this.socketService.onUserJoined().subscribe((data) => {
        console.log(data.message);
      })
    );

    this.subscriptions.push(
      this.socketService.onUserLeft().subscribe((data) => {
        console.log(data.message);
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedChannel'] && this.selectedChannel && this.currentUser) {
      this.messages = [];
      
      this.socketService.joinChannel(this.selectedChannel.id);
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.selectedChannel) {
      this.socketService.leaveChannel(this.selectedChannel.id);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  sendMessage(): void {
    if (this.messageText.trim() && this.currentUser && this.selectedChannel) {
      this.socketService.sendMessage(
        this.selectedChannel.id,
        this.messageText.trim()
      );
      this.messageText = '';
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
      
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedImage || !this.currentUser || !this.selectedChannel) {
      return;
    }

    this.uploadingImage = true;
    const formData = new FormData();
    formData.append('image', this.selectedImage);
    formData.append('channelId', this.selectedChannel.id.toString());
    formData.append('userId', this.currentUser.id.toString());
    formData.append('username', this.currentUser.username);

    this.http.post<{imageUrl: string}>(`${environment.apiUrl}/images/chat`, formData)
      .subscribe({
        next: (response) => {
          this.socketService.sendMessage(
            this.selectedChannel!.id,
            '',
            response.imageUrl
          );
          this.selectedImage = null;
          this.imagePreview = null;
          this.uploadingImage = false;
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        },
        error: (error) => {
          console.error('Image upload failed:', error);
          alert('Failed to upload image. Please try again.');
          this.uploadingImage = false;
        }
      });
  }

  cancelImageUpload(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatTimestamp(timestamp: Date | string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesArea) {
        this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
      }
    } catch (err) {
    }
  }
}
