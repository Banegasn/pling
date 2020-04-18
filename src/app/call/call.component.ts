import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { WebcamImage } from 'ngx-webcam';
import { interval, Subject, Observable } from 'rxjs';
import { map, switchMap, tap, startWith, shareReplay } from 'rxjs/operators';
import { SocketioService } from '../services/socketio.service';

const FPS = 10;

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallComponent implements OnInit {

  imageListener$: Subject<WebcamImage> = new Subject<WebcamImage>();
  imageTrigger = new EventEmitter<void>();
  imagePartner$: Observable<{id: string, image: string}>;

  constructor(
    private _socket: SocketioService
  ) { }

  ngOnInit(): void {
    interval(1000 / FPS)
      .pipe(
        tap(() => this.imageTrigger.next()),
        switchMap(() => this.imageListener$),
        map(image => image.imageAsBase64)
      ).subscribe(image => {
          this._socket.emit('image', {id: this._socket.id, image});
      });

    this.imagePartner$ = this._socket.listen('image')
      .pipe(
        startWith({image: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}),
        map(data => ({...data, image: `data:image/jpeg;base64,${data.image}`})),
        shareReplay(1)
      );
  }

}
