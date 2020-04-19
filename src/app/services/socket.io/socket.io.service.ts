import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private _connected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly connected$: Observable<boolean> = this._connected$.asObservable();

  private socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io(environment.SOCKET_ENDPOINT, {transports: ['websocket']});
    this.socket.on('disconnect', () => {
      this._connected$.next(false);
    });
    this.socket.on('connect', () => {
      this._connected$.next(true);
    });
  }

  listen(event: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(event, (data: any) => {
        subscriber.next(data);
      });
    });
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  get id(): string {
    return this.socket.id;
  }
}
