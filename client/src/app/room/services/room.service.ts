import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { filter, switchMap, takeUntil, tap, map } from 'rxjs/operators';
import { SocketioService } from 'src/app/services/socket.io/socket.io.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService implements OnDestroy {

  private _room$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  readonly room$: Observable<string> = this._room$.asObservable();

  private _users: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  readonly users$: Observable<any[]> = this._users.asObservable();

  private _roomies$: BehaviorSubject<{id: string, stream: MediaStream}[]>
    = new BehaviorSubject<{id: string, stream: MediaStream}[]>([]);
  readonly roomies$ = this._roomies$.asObservable();

  private _onDestroy$: Subject<void> = new Subject();

  constructor(
    private _socket: SocketioService
  ) {
    // when socket disconnects, send join room message again next time it reconnects
    this._socket.connected$.pipe(filter(connected => !!connected))
    .pipe(
      switchMap(() => this.room$.pipe(filter(room => room != null)))
    ).subscribe((room) => {
      this._socket.emit('join-room', {room});
    });

    // listen to users joining and leaving current room
    merge(
      this._socket.listen('join-room'),
      this._socket.listen('leave-room')
    ).pipe(
      takeUntil(this._onDestroy$)
    ).subscribe(data => {
      this._users.next(data.users);
    });
  }

  ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  joinRoom(room: string): void {
    this._room$.next(room);
  }

  leaveRoom(room: string): void {
    this._users.next([]);
    this._room$.next(null);
    this._socket.emit('leave-room', {room, id: this._socket.id});
  }

  addRoomie(roomie: {id: string, stream: MediaStream}) {
    this._roomies$.next(this._roomies$.getValue().concat(roomie));
  }

  addMe(stream: MediaStream) {
    this._roomies$.next(this._roomies$.getValue().concat({id: this._socket.id, stream}));
  }

  messageRTC(data: any): void {
    this._socket.emit('peer-message', {...data, room: this._room$.getValue()});
  }

  messageRTC$(): Observable<any> {
    return this._socket.listen('peer-message').pipe(tap(console.log));
  }

  myRoomies$() {
    return this.users$.pipe(map(users => users.filter(user => user !== this._socket.id)));
  }

}
