import { ChangeDetectionStrategy, Component, HostListener, OnDestroy,
  OnInit, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebRTCService } from '@core/services/webRTC/webRTC.service';
import { VideoElementComponent } from './components/video-element/video-element.component';
import { RoomService } from './services/room.service';
import { StreamService } from '../core/services/stream/stream.service';

@Component({
  selector: 'app-call',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements OnDestroy, OnInit {

  @ViewChild('myCam') private localCam: VideoElementComponent;
  @ViewChildren('.roomie-cam') private roomiesCams: VideoElementComponent[];

  private room: string = null;

  roomies$: Observable<any>;
  stream: MediaStream;

  constructor(
    private _room: RoomService,
    private _webRTC: WebRTCService,
    private _route: ActivatedRoute,
    private _videoStream: StreamService
  ) {
    this._videoStream.getStream$({
      audio: true,
      video: {
        height: {
          max: 480
        },
        frameRate: {
          max: 12
        }
      }
    }).subscribe(
      stream => this.stream = stream
      );
    this._webRTC.start();
  }

  ngOnInit() {
    this.room = this._route.snapshot.paramMap.get('id');
    this._room.joinRoom(this.room);
    this.roomies$ = this._room.roomies$.pipe(tap(console.log));
  }

  @HostListener('window:beforeunload') beforeunloadHandler(): void {
    this._room.leaveRoom(this.room);
  }

  ngOnDestroy(): void {
    this._room.leaveRoom(this.room);
  }

  toggleAudio() {
    this.stream.getAudioTracks()[0].enabled = !this.stream.getAudioTracks()[0].enabled;
  }

  micEnabled() {
    return this.stream.getAudioTracks()[0].enabled;
  }

  toggleVideo() {
    this.stream.getVideoTracks()[0].enabled = !this.stream.getVideoTracks()[0].enabled;
  }

  camEnabled() {
    return this.stream.getVideoTracks()[0].enabled;
  }

}
