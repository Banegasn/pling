import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { filter, take, takeUntil, map } from 'rxjs/operators';
import { SocketioService } from 'src/app/services/socket.io/socket.io.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService implements OnDestroy {

  activeRoom: string = null;
  users$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _onDestroy: Subject<void> = new Subject();

  constructor(private _socket: SocketioService) {
    // when socket disconnects, send join room message again next time it reconnects
    this._socket.connected$.pipe(
      filter(connected => !connected && this.activeRoom !== null),
      takeUntil(this._onDestroy)
    ).subscribe(() =>
      this.joinRoom(this.activeRoom)
    );

    merge(
      this._socket.listen('join-room'),
      this._socket.listen('leave-room')
    ).pipe(
      map(data => data.users),
      takeUntil(this._onDestroy)
    ).subscribe(users => {
      this.users$.next(users);
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  joinRoom(room: string): void {
    this._socket.connected$.pipe(
      filter(connected => !!connected && this.activeRoom !== null),
      take(1)
    ).subscribe(() => {
      this._socket.emit('join-room', {room, id: this._socket.id});
    });
    this.activeRoom = room;
  }

  leaveRoom(room: string): void {
    this.users$.next([]);
    this._socket.emit('leave-room', {room, id: this._socket.id});
    this.activeRoom = null;
  }

}
