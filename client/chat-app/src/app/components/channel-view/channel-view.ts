import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../models/channel.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-channel-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-view.html',
  styleUrl: './channel-view.css'
})
export class ChannelView implements OnInit, AfterViewChecked {
  @Input() selectedChannel: Channel | null = null;
  @Input() currentUser: User | null = null;
  @Input() messages: any[] = [];
  @Input() onlineMembers: number = 0;
  
  @ViewChild('messagesArea') private messagesArea!: ElementRef;
  
  messageText: string = '';

  constructor() {}

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (this.messageText.trim() && this.currentUser) {
      const newMessage = {
        username: this.currentUser.username,
        content: this.messageText.trim(),
        timestamp: new Date(),
        channelId: this.selectedChannel?.id
      };
      
      this.messages.push(newMessage);
      this.messageText = '';
      
      console.log('Message sent:', newMessage);
    }
  }

  formatTimestamp(timestamp: Date): string {
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
      console.error('Error scrolling to bottom:', err);
    }
  }
}
