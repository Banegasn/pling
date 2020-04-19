import { ChangeDetectionStrategy, Component, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { VideoElementComponent } from './components/video-element.component';
import { RoomService } from './services/room.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallComponent implements AfterViewInit, OnDestroy {

  @ViewChild('mycam') localCamera: VideoElementComponent;

  private room = 'this-is-a-room-id';

  constructor(
    private _room: RoomService,
    private _toast: ToastService
  ) { }

  @HostListener('window:beforeunload')
  beforeunloadHandler(): void {
    this._room.leaveRoom(this.room);
  }

  ngAfterViewInit(): void {
    this.initCamera();
    this._room.joinRoom(this.room);
  }

  ngOnDestroy(): void {
    this._room.leaveRoom(this.room);
  }

  initCamera(): void {
    navigator.getUserMedia(
      { video: true, audio: true },
      stream => {
        this.localCamera.src = stream;
        this.localCamera.play();
        this.localCamera.mute();
      },
      () => {
        this._toast.text('unable to access user camera');
      }
     );
  }

}
