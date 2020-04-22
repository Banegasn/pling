import { ChangeDetectionStrategy, Component, ViewChild, AfterViewInit, OnDestroy, HostListener, OnInit } from '@angular/core';
import { VideoElementComponent } from './components/video-element/video-element.component';
import { RoomService } from './services/room.service';
import { ActivatedRoute } from '@angular/router';
import { WebrtcService } from './services/rtc.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-call',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements AfterViewInit, OnDestroy, OnInit {

  @ViewChild('mycam') localCamera: VideoElementComponent;
  @ViewChild('roomie') roomieCamera: VideoElementComponent;

  private room: string = null;

  roomies$: Observable<any>;
  myId: string;

  constructor(
    private _room: RoomService,
    private _webRTC: WebrtcService,
    private _route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.room = this._route.snapshot.paramMap.get('id');
    this.roomies$ = this._room.roomies$.pipe(tap(console.log));
    this.myId = this._room.myId;
  }

  @HostListener('window:beforeunload')
  beforeunloadHandler(): void {
    this._room.leaveRoom(this.room);
  }

  ngAfterViewInit(): void {
    this._webRTC.start();
    this._room.joinRoom(this.room);
  }

  ngOnDestroy(): void {
    this._room.leaveRoom(this.room);
  }

}
