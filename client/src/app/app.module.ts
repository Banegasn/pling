import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SharedModule } from '@shared/shared.module';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TextToastComponent } from './core/services/toast/templates/text-toast.component';
import { NavComponent } from './nav/nav.component';
import { ToastMessagesComponent } from './room/components/toast-messages/toast-messages.component';
import { UserListComponent } from './room/components/user-list/user-list.component';
import { RoomModule } from './room/room.module';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ToastMessagesComponent,
    TextToastComponent,
    UserListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    RoomModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
