import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor() { }

  get AudioAndVideoStream$(): Observable<MediaStream> {
    return new Observable((subscriber) => {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(
        stream => subscriber.next(stream)
      );
    });
  }

}
