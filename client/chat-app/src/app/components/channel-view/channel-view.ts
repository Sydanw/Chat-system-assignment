import { Component, Input, OnInit } from '@angular/core';
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
export class ChannelView implements OnInit {
  @Input() channel: Channel | null = null;
  @Input() currentUser: User | null = null;
  
  messages: any[] = [];
  messageText: string = '';
  memberCount: number = 15;

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.messages = [
      { username: 'alice', text: 'Good morning everyone!', timestamp: new Date() },
      { username: 'bob', text: 'Has anyone seen the latest update?', timestamp: new Date() },
      { username: 'charlie', text: 'Yes, looks great!', timestamp: new Date() },
      { username: 'john_doe', text: 'I agree, very impressed', timestamp: new Date() }
    ];
  }

  sendMessage(): void {
    if (this.messageText.trim() && this.currentUser) {
      const newMessage = {
        username: this.currentUser.username,
        text: this.messageText.trim(),
        timestamp: new Date()
      };
      this.messages.push(newMessage);
      this.messageText = '';
    }
  }
}
