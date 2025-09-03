import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (authService.isAuthenticated() && sessionService.isSessionValid()) {
    return true;
  }

  sessionService.endSession();
  router.navigate(['/home']);
  return false;
};
