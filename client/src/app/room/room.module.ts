import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomComponent } from './room.component';
import { SharedModule } from '@shared/shared.module';
import { VideoElementComponent } from './components/video-element/video-element.component';

@NgModule({
  declarations: [
    RoomComponent,
    VideoElementComponent
  ],
  imports: [ SharedModule ],
  exports: [],
  providers: [],
})
export class RoomModule {}
