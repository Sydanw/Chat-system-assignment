import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Peer, DataConnection } from 'peerjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.css'
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @Input() channelId = '';
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef<HTMLVideoElement>;

  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private call: any = null;
  private subscriptions = new Subscription();

  isVideoEnabled = false;
  isAudioEnabled = false;
  isConnected = false;
  isInCall = false;
  remotePeerConnected = false;

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🎥 VideoChatComponent initialized for channel:', this.channelId);
    this.initializePeer();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.subscriptions.unsubscribe();
  }

  private initializePeer(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      const peerId = `${currentUser?.username}_${this.channelId}_${Date.now()}`;
      
      this.peer = new Peer(peerId, {
        host: environment.peerConfig.host,
        port: environment.peerConfig.port,
        path: environment.peerConfig.path,
        secure: environment.peerConfig.secure,
        debug: 3,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', async (id) => {
        console.log('🎥 Peer connected with ID:', id);
        console.log('🔗 Registering peer ID with Socket.io for channel:', this.channelId);
        this.isConnected = true;

        this.socketService.registerPeerID(id, this.channelId);
      });

      this.peer.on('call', (call) => {
        console.log('Receiving call from:', call.peer);
        this.handleIncomingCall(call);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Error initializing peer:', error);
    }
  }

  private setupSocketListeners(): void {
    this.subscriptions.add(
      this.socketService.onPeerIDAvailable().subscribe(async (peerID: string) => {
        console.log('🔔 PEER ID AVAILABLE:', peerID);
        console.log('🔍 Current state - peer:', !!this.peer, 'localStream:', !!this.localStream, 'isInCall:', this.isInCall, 'isVideoEnabled:', this.isVideoEnabled);
        console.log('🆔 My peer ID:', this.peer?.id, 'Remote peer ID:', peerID);

        if (this.peer && this.peer.id === peerID) {
          console.log('🚫 Ignoring own peer ID');
          return;
        }

        if (!this.isVideoEnabled || !this.localStream) {
          console.log('⏳ Waiting for video to be enabled before calling peer');
          return;
        }

        if (this.peer && this.peer.open && !this.isInCall) {
          const shouldInitiateCall = this.peer.id < peerID;
          console.log('📞 Call decision - MyID:', this.peer.id, 'RemoteID:', peerID, 'ShouldInitiate:', shouldInitiateCall);

          if (shouldInitiateCall) {
            console.log('📞 INITIATING CALL to peer:', peerID);
            console.log('📞 Peer connection state:', this.peer.open ? 'OPEN' : 'NOT OPEN');

            setTimeout(async () => {
              if (!this.isInCall) {
                await this.callPeer(peerID);
              } else {
                console.log('🚫 Already in call, skipping call initiation');
              }
            }, 500);
          } else {
            console.log('⏳ Waiting for remote peer to initiate call (they have priority)');
          }
        } else {
          console.log('❌ Cannot call peer - peer:', !!this.peer, 'peer.open:', this.peer?.open, 'isInCall:', this.isInCall);
        }
      })
    );
  }

  async toggleVideo(): Promise<void> {
    console.log('toggleVideo called, current isVideoEnabled:', this.isVideoEnabled);
    console.log('Current peer connection status:', this.isConnected);

    if (!this.isVideoEnabled) {
      console.log('Starting video...');
      await this.startVideo();

      if (this.peer && this.channelId) {
        console.log('🎥 Re-announcing peer ID now that video is enabled:', this.peer.id);
        await new Promise(resolve => setTimeout(resolve, 300));
        this.socketService.registerPeerID(this.peer.id, this.channelId);
      }
    } else {
      console.log('Stopping video...');
      this.stopVideo();
    }
  }

  async toggleAudio(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !this.isAudioEnabled;
        this.isAudioEnabled = audioTrack.enabled;
      }
    } else if (!this.isAudioEnabled) {
      await this.startAudio();
    }
  }

  private async startVideo(): Promise<void> {
    try {
      console.log('Requesting camera access...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      };

      console.log('Requesting media with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream obtained:', this.localStream);

      const videoElement = this.localVideo.nativeElement;
      videoElement.srcObject = this.localStream;
      
      try {
        await videoElement.play();
        console.log('Video element is playing');
      } catch (playError) {
        console.warn('Video play error (might be normal):', playError);
      }

      this.isVideoEnabled = true;

      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        this.isAudioEnabled = true;
        audioTrack.enabled = true;
        console.log('Audio track enabled:', this.isAudioEnabled);
      }

      console.log('Video started successfully');

    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let message = 'Could not access camera. ';
      if (error.name === 'NotAllowedError') {
        message += 'Permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        message += 'No camera found. Please check your camera connection.';
      } else if (error.name === 'NotReadableError') {
        message += 'Camera is being used by another application.';
      } else {
        message += error.message || 'Unknown error occurred.';
      }
      
      alert(message);
      this.isVideoEnabled = false;
    }
  }

  private async startAudio(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: this.isVideoEnabled,
        audio: true
      });

      if (this.isVideoEnabled) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
      this.isAudioEnabled = true;

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }

  private stopVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }
      this.localVideo.nativeElement.srcObject = null;
      this.isVideoEnabled = false;

      if (this.isAudioEnabled) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((audioStream) => {
            this.localStream = audioStream;
          })
          .catch(console.error);
      } else {
        this.localStream = null;
      }
    }
  }

  private async callPeer(remotePeerID: string): Promise<void> {
    if (!this.peer) {
      console.error('❌ Cannot call peer: peer not available');
      return;
    }

    if (!this.localStream || this.localStream.getTracks().length === 0) {
      console.log('⚠️ No stream available, creating audio-only stream for call');
      await this.ensurePeerStream();
    }

    console.log('📞 STARTING OUTGOING CALL to peer:', remotePeerID);
    console.log('📞 Local stream details:', {
      id: this.localStream?.id || 'no-stream',
      videoTracks: this.localStream?.getVideoTracks().length || 0,
      audioTracks: this.localStream?.getAudioTracks().length || 0,
      isVideoEnabled: this.isVideoEnabled
    });

    if (!this.localStream) {
      console.error('❌ Cannot call peer: no local stream available');
      return;
    }

    this.call = this.peer.call(remotePeerID, this.localStream);
    this.isInCall = true;
    console.log('📞 Call object created:', this.call);

    this.call.on('stream', (remoteStream: MediaStream) => {
      console.log('🎥 RECEIVED REMOTE STREAM from outgoing call!');
      console.log('🎥 Remote stream details:', {
        id: remoteStream.id,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });
      
      this.remoteStream = remoteStream;
      this.remotePeerConnected = true;
      
      setTimeout(() => {
        console.log('🔍 DOM check - remoteVideo exists:', !!this.remoteVideo?.nativeElement);
        if (this.remoteVideo?.nativeElement) {
          const videoElement = this.remoteVideo.nativeElement;
          console.log('📺 Configuring remote video element for outgoing call');
          
          videoElement.style.display = 'block';
          videoElement.style.width = '100%';
          videoElement.style.height = 'auto';
          videoElement.muted = false;
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.controls = false;
          
          videoElement.srcObject = remoteStream;
          console.log('✅ Remote video element configured for outgoing call');
          console.log('🔍 Stream info:', {
            active: remoteStream.active,
            videoTracks: remoteStream.getVideoTracks().map(t => ({
              id: t.id,
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState
            }))
          });

          videoElement.play().then(() => {
            console.log('✅ Remote video started playing successfully');
          }).catch((error: any) => {
            console.warn('❌ Remote video autoplay failed, trying without autoplay:', error);
            videoElement.autoplay = false;
            videoElement.play();
          });
        } else {
          console.error('❌ Remote video element not available for outgoing call');
          console.log('🔍 ViewChild state:', this.remoteVideo);
        }
      }, 200);
    });

    this.call.on('close', () => {
      console.log('📞 Outgoing call closed');
      this.endCall();
    });

    this.call.on('error', (error: any) => {
      console.error('❌ Outgoing call error:', error);
      this.endCall();
    });

    setTimeout(() => {
      if (this.call && !this.remotePeerConnected) {
        console.warn('⏰ Call timeout - no remote stream received within 10 seconds');
      }
    }, 10000);
  }

  private async handleIncomingCall(call: any): Promise<void> {
    console.log('📞 INCOMING CALL received from:', call.peer);

    if (!this.localStream || this.localStream.getTracks().length === 0) {
      console.log('⚠️ No stream available, creating audio-only stream for answer');
      await this.ensurePeerStream();
    }

    console.log('📞 ANSWERING INCOMING CALL from:', call.peer);
    console.log('📞 Local stream details for answer:', {
      id: this.localStream?.id || 'no-stream',
      videoTracks: this.localStream?.getVideoTracks().length || 0,
      audioTracks: this.localStream?.getAudioTracks().length || 0,
      isVideoEnabled: this.isVideoEnabled
    });

    if (!this.localStream) {
      console.error('❌ Cannot answer call: no local stream available');
      return;
    }

    this.call = call;
    this.isInCall = true;
    call.answer(this.localStream);

    call.on('stream', (remoteStream: MediaStream) => {
      console.log('🎥 RECEIVED REMOTE STREAM from incoming call!');
      console.log('🎥 Remote stream details:', {
        id: remoteStream.id,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });
      
      this.remoteStream = remoteStream;
      this.remotePeerConnected = true;
      
      setTimeout(() => {
        console.log('🔍 DOM check - remoteVideo exists:', !!this.remoteVideo?.nativeElement);
        if (this.remoteVideo?.nativeElement) {
          const videoElement = this.remoteVideo.nativeElement;
          console.log('📺 Configuring remote video element for incoming call');
          
          videoElement.style.display = 'block';
          videoElement.style.width = '100%';
          videoElement.style.height = 'auto';
          videoElement.muted = false;
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.controls = false;
          
          videoElement.srcObject = remoteStream;
          console.log('✅ Remote video element configured for incoming call');
          console.log('🔍 Stream info:', {
            active: remoteStream.active,
            videoTracks: remoteStream.getVideoTracks().map(t => ({
              id: t.id,
              label: t.label,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState
            }))
          });

          videoElement.play().then(() => {
            console.log('✅ Remote video started playing successfully (incoming call)');
          }).catch((error: any) => {
            console.warn('❌ Remote video autoplay failed, trying without autoplay (incoming):', error);
            videoElement.autoplay = false;
            videoElement.play();
          });
        } else {
          console.error('❌ Remote video element not available for incoming call');
          console.log('🔍 ViewChild state:', this.remoteVideo);
        }
      }, 200);
    });

    call.on('close', () => {
      console.log('📞 Incoming call closed');
      this.endCall();
    });

    call.on('error', (error: any) => {
      console.error('❌ Incoming call error:', error);
      this.endCall();
    });

    setTimeout(() => {
      if (this.call && !this.remotePeerConnected) {
        console.warn('⏰ Incoming call timeout - no remote stream received within 10 seconds');
      }
    }, 10000);
  }

  endCall(): void {
    if (this.call) {
      this.call.close();
      this.call = null;
    }

    this.isInCall = false;
    this.remotePeerConnected = false;
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    if (this.remoteVideo && this.remoteVideo.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
  }

  private async ensurePeerStream(): Promise<void> {
    console.log('🔍 Checking stream status - hasStream:', !!this.localStream, 'trackCount:', this.localStream?.getTracks().length || 0, 'videoEnabled:', this.isVideoEnabled);
    
    if (!this.localStream || this.localStream.getTracks().length === 0) {
      console.log('📹 Creating stream for peer connections - video enabled:', this.isVideoEnabled);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: this.isVideoEnabled ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false,
          audio: true
        });
        console.log('✅ Created stream for peer connections:', {
          id: this.localStream.id,
          tracks: this.localStream.getTracks().length,
          audioTracks: this.localStream.getAudioTracks().length,
          videoTracks: this.localStream.getVideoTracks().length
        });
      } catch (error) {
        console.warn('⚠️ Failed to create full stream, creating audio-only:', error);
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          console.log('✅ Created audio-only fallback stream');
        } catch (audioError) {
          console.warn('⚠️ Failed to create audio stream, creating empty stream:', audioError);
          this.localStream = new MediaStream();
        }
      }
    } else {
      console.log('✅ Stream already exists:', {
        id: this.localStream.id,
        tracks: this.localStream.getTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });
    }
  }

  private cleanup(): void {
    this.endCall();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isVideoEnabled = false;
    this.isAudioEnabled = false;
    this.isConnected = false;
  }
}
