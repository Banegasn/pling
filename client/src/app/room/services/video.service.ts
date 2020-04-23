import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  private _stream = new BehaviorSubject<MediaStream>(null);
  readonly stream$ = this._stream.asObservable();

  constructor() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(
      stream => this._stream.next(stream)
    );
  }

  get audioAndVideoStream$(): Observable<MediaStream> {
    return this.stream$.pipe(filter(stream => stream !== null));
  }

}
