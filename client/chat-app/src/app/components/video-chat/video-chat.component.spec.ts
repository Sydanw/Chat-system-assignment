import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoChatComponent } from './video-chat.component';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('VideoChatComponent', () => {
  let component: VideoChatComponent;
  let fixture: ComponentFixture<VideoChatComponent>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockSocketService = jasmine.createSpyObj('SocketService', ['on', 'emit', 'connect', 'disconnect']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    
    mockAuthService.getCurrentUser.and.returnValue({
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      role: 'user',
      groups: []
    });

    await TestBed.configureTestingModule({
      imports: [VideoChatComponent],
      providers: [
        { provide: SocketService, useValue: mockSocketService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoChatComponent);
    component = fixture.componentInstance;
    component.channelId = '1';
  });

  it('should create the video chat component', () => {
    expect(component).toBeTruthy();
  });

  it('should use environment.peerConfig for PeerJS configuration', () => {
    expect(environment.peerConfig).toBeDefined();
    expect(environment.peerConfig.host).toBe('localhost');
    expect(environment.peerConfig.port).toBe(3000);
    expect(environment.peerConfig.path).toBe('/peerjs');
    expect(environment.peerConfig.secure).toBe(false);
  });
});
