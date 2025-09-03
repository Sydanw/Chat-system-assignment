import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './app/components/login/login';

bootstrapApplication(App, {
  providers: [
    importProvidersFrom(
      HttpClientModule,
      RouterModule.forRoot([
        { 
          path: 'login', 
          component: LoginComponent 
        },
        { 
          path: '', 
          redirectTo: '/login', 
          pathMatch: 'full' 
        }
      ])
    )
  ]
}).catch(err => console.error(err));