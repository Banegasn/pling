import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, share } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private _connected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly connected$: Observable<boolean> = this._connected$.asObservable();

  private _listening: Observable<any>[] = [];

  private socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io(environment.webSocketURL,
      {transports: ['websocket']}
    );
    this.socket.on('disconnect', () => {
      this._connected$.next(false);
    });
    this.socket.on('connect', () => {
      this._connected$.next(true);
    });
  }

  listen$(event: string): Observable<any> {
    if (!this._listening[event]) {
      this._listening[event] = new Observable((subscriber) => {
        console.log('listening ', event);
        this.socket.on(event, (data: any) => {
          subscriber.next(data);
        });
      }).pipe(
        share(),
        finalize(() => {
          this.socket.off(event);
          this._listening[event] = null;
        })
      );
    }
    return this._listening[event];
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  get id(): string {
    return this.socket.id;
  }
}
