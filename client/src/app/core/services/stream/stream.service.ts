import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private _stream = new ReplaySubject<MediaStream>();
  private _screen: BehaviorSubject<MediaStream> = new BehaviorSubject(null);
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
    mediaDevices.getDisplayMedia(constraints).then((stream: MediaStream) => {
      this._screen.next(stream);
      stream.getVideoTracks()[0].onended = () => {
        this._screen.next(null);
      };
    });
    return this.screen$;
  }

  stopScreenCapture() {
    this._screen.getValue().getTracks()
        .forEach(track => track.stop());
    this._screen.next(null);
  }

  screenCaptureIsActive() {
    return this._screen.getValue() !== null;
  }

}
