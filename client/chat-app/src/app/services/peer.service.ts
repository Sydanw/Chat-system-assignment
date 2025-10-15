import { Injectable } from '@angular/core';
import Peer, { MediaConnection } from 'peerjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private currentCall: MediaConnection | null = null;
  
  public remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  public localStream$ = new BehaviorSubject<MediaStream | null>(null);
  public peerId$ = new BehaviorSubject<string | null>(null);

  constructor() {}

  async initializePeer(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(`user-${userId}-${Date.now()}`, environment.peerConfig);

      this.peer.on('open', (id) => {
        this.peerId$.next(id);
        resolve(id);
      });

      this.peer.on('call', (call) => {
        this.answerCall(call);
      });

      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        reject(error);
      });
    });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      this.localStream$.next(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  callPeer(remotePeerId: string) {
    if (!this.peer || !this.localStream) {
      console.error('Peer or local stream not initialized');
      return;
    }

    this.currentCall = this.peer.call(remotePeerId, this.localStream);
    
    this.currentCall.on('stream', (remoteStream) => {
      this.remoteStream$.next(remoteStream);
    });
  }

  private answerCall(call: MediaConnection) {
    if (!this.localStream) {
      console.error('Local stream not initialized');
      return;
    }

    call.answer(this.localStream);
    this.currentCall = call;

    call.on('stream', (remoteStream) => {
      this.remoteStream$.next(remoteStream);
    });
  }

  endCall() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
    this.remoteStream$.next(null);
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.localStream$.next(null);
    }
  }

  destroy() {
    this.endCall();
    this.stopLocalStream();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.peerId$.next(null);
  }
}
