import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private _stream = new ReplaySubject<MediaStream>();
  private _screen = new Subject<MediaStream>();
  readonly stream$ = this._stream.asObservable();
  readonly screen$ = this._stream.asObservable();

  constructor() {
  }

  getStream$(constraints: MediaStreamConstraints): Observable<MediaStream> {
    navigator.mediaDevices.getUserMedia(constraints).then(
      stream => this._stream.next(stream)
    );
    return this.stream$;
  }

  getScreenCapture$(constraints: any): Observable<MediaStream> {
    const mediaDevices = navigator.mediaDevices as any;
    mediaDevices.getDisplayMedia(constraints).then(
      (stream: MediaStream) => this._screen.next(stream)
    );
    return this.screen$;
  }

}
