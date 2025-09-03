import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  private readonly WARNING_TIME = 5 * 60 * 1000;
  private sessionTimer: any;
  private warningTimer: any;
  private lastActivity: number = Date.now();
  
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  public sessionExpired$ = this.sessionExpiredSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeSessionTracking();
  }

  private initializeSessionTracking(): void {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimer(), true);
    });
  }

  startSession(): void {
    this.lastActivity = Date.now();
    this.setSessionData();
    this.resetSessionTimer();
  }

  private setSessionData(): void {
    const sessionData = {
      loginTime: Date.now(),
      lastActivity: this.lastActivity,
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    };
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
  }

  private resetSessionTimer(): void {
    this.lastActivity = Date.now();
    this.updateSessionData();
    
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);

    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.SESSION_TIMEOUT);
  }

  private updateSessionData(): void {
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    if (sessionData.loginTime) {
      sessionData.lastActivity = this.lastActivity;
      sessionData.expiresAt = Date.now() + this.SESSION_TIMEOUT;
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
    }
  }

  private showSessionWarning(): void {
    console.warn('Session will expire in 5 minutes due to inactivity');
  }

  private expireSession(): void {
    console.log('Session expired due to inactivity');
    this.sessionExpiredSubject.next(true);
    this.endSession();
  }

  endSession(): void {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    
    localStorage.removeItem('sessionData');
    
    this.authService.logout();
    
    this.clearBrowserCache();
    this.router.navigate(['/home']);
  }

  private clearBrowserCache(): void {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    history.replaceState(null, '', '/home');
  }

  isSessionValid(): boolean {
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    if (!sessionData.expiresAt) return false;
    
    const now = Date.now();
    return now < sessionData.expiresAt;
  }

  getSessionTimeRemaining(): number {
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    if (!sessionData.expiresAt) return 0;
    
    return Math.max(0, sessionData.expiresAt - Date.now());
  }
}
