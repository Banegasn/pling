import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebRTCService } from '@core/services/webRTC/webRTC.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { StreamService } from '../core/services/stream/stream.service';
import { RoomService } from './services/room.service';

@Component({
  selector: 'app-call',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements OnDestroy, OnInit {

  private room: string = null;
  private screenSharing: BehaviorSubject<MediaStream> = new BehaviorSubject(null);

  roomies$: Observable<any>;
  screenStream = this.screenSharing.asObservable().pipe(shareReplay());
  stream: MediaStream;

  constructor(
    private _room: RoomService,
    private _webRTC: WebRTCService,
    private _route: ActivatedRoute,
    private _videoStream: StreamService
  ) { }

  ngOnInit() {
    this.room = this._route.snapshot.paramMap.get('id');
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
    }).subscribe((stream) => {
      this.stream = stream;
      this._webRTC.start();
      this._room.joinRoom(this.room);
    });
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

  toggleShareScreen() {
    if (this.screenSharing.getValue() !== null) {
      this.screenSharing.getValue().getTracks()
        .forEach(track => track.stop());
      return this.screenSharing.next(null);
    }
    const displayMediaOptions = {
      video: true,
      audio: false
    };
    const mediaDevices = navigator.mediaDevices as any;
    mediaDevices.getDisplayMedia(displayMediaOptions).then((stream: MediaStream) => {
      this.screenSharing.next(stream);
      stream.getVideoTracks()[0].onended = () => {
        this.screenSharing.next(null);
      };
    });
  }
}
