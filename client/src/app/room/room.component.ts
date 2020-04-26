import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { WebRTCService } from '@core/services/webRTC/webRTC.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay, tap, map, takeUntil, switchMap, take } from 'rxjs/operators';
import { StreamService } from '../core/services/stream/stream.service';
import { RoomService } from './services/room.service';
import { UserVideoConstraints } from './models/userVideoConstraints';
import { ScreenCaptureConstraints } from './models/screenCaptureConstraints';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-room',
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
  _onDestroy = new Subject();

  constructor(
    private _room: RoomService,
    private _webRTC: WebRTCService,
    private _route: ActivatedRoute,
    private _videoStream: StreamService,
    private _titleService: Title
  ) { }

  ngOnInit() {

    this._webRTC.start();

    this._route.paramMap.pipe(
      map((params: ParamMap) => params.get('id')),
      switchMap((id) => this._videoStream.getStream$(UserVideoConstraints).pipe(
        take(1),
        tap((stream) => {
          if (this.room !== null && this.room !== id) {
            this._room.leaveRoom(this.room);
            this._webRTC.clear();
          }
          this.room = id;
          this._titleService.setTitle(`Pling! | ${this.room}`);
          this._room.joinRoom(this.room);
          this.stream = stream;
        }
      ))),
      takeUntil(this._onDestroy)
    ).subscribe();

    this.roomies$ = this._room.roomies$.pipe(tap(console.log));
  }

  @HostListener('window:beforeunload') beforeunloadHandler(): void {
    this._room.leaveRoom(this.room);
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
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
    const mediaDevices = navigator.mediaDevices as any;
    mediaDevices.getDisplayMedia(ScreenCaptureConstraints).then((stream: MediaStream) => {
      this.screenSharing.next(stream);
      stream.getVideoTracks()[0].onended = () => {
        this.screenSharing.next(null);
      };
    }, (error) => {
      console.log('error setting screen sharing', error);
    });
  }
}
