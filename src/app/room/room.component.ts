import { ChangeDetectionStrategy, Component, ViewChild, AfterViewInit, OnDestroy, HostListener, OnInit } from '@angular/core';
import { ToastService } from '../services/toast/toast.service';
import { VideoElementComponent } from './components/video-element/video-element.component';
import { RoomService } from './services/room.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-call',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements AfterViewInit, OnDestroy, OnInit {

  @ViewChild('mycam') localCamera: VideoElementComponent;

  private room: string = null;

  constructor(
    private _room: RoomService,
    private _toast: ToastService,
    private _route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.room = this._route.snapshot.paramMap.get('id');
  }

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
