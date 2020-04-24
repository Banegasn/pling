import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { filter, switchMap, takeUntil, tap, shareReplay, share, map } from 'rxjs/operators';
import { SocketioService } from '@core/services/socket.io/socket.io.service';
import { RoomMessage } from '../models/roomMessages';
import { RoomEvent } from '../models/roomUserJoin';
import { Roomie } from '../models/roomie';

@Injectable({
  providedIn: 'root'
})
export class RoomService implements OnDestroy {

  private _room: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  readonly room$: Observable<string> = this._room.asObservable();

  private _users: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  readonly users$: Observable<any[]> = this._users.asObservable();

  private _roomies: BehaviorSubject<Roomie[]>
    = new BehaviorSubject<{id: string, stream: MediaStream}[]>([]);
  readonly roomies$ = this._roomies.asObservable();

  private _onDestroy$: Subject<void> = new Subject();

  constructor(
    private _socket: SocketioService
  ) {
    // when socket disconnects, send join room message again next time it reconnects
    this._socket.connected$.pipe(filter(connected => !!connected))
    .pipe(
      switchMap(() => this.room$.pipe(filter(room => room != null))),
      takeUntil(this._onDestroy$)
    ).subscribe((room) => {
      this._socket.emit(RoomMessage.JoinRoom, {room});
    });

    // listen to users joining and leaving current room
    merge(
      this.joinRoomEvent$,
      this.leaveRoomEvent$
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
    this._room.next(room);
  }

  leaveRoom(room: string): void {
    this._users.next([]);
    this._roomies.next([]);
    this._room.next(null);
    this._socket.emit(RoomMessage.LeaveRoom, {room});
  }

  addRoomie(roomie: Roomie) {
    if ( !this._roomies.getValue().find(elem => elem.id === roomie.id) ){
      this._roomies.next(this._roomies.getValue().concat(roomie));
    }
  }

  deleteRoomie(id: string): void {
    const roomieToDelete = this._roomies.getValue().find(roomie => roomie.id === id);
    if (roomieToDelete.stream && roomieToDelete.stream.getTracks()) {
      roomieToDelete.stream.getTracks().forEach(track => {
        track.stop();
        roomieToDelete.stream.removeTrack(track);
      });
      this._roomies.next(this._roomies.getValue().filter(roomie => roomie.id !== id));
    }
  }

  getRoomie(id: string): Observable<Roomie>{
    return this.roomies$.pipe(map(roomies => roomies.find(roomie => roomie.id === id)));
  }

  userJoined$(): Observable<RoomEvent> {
    return this.joinRoomEvent$
      .pipe(filter(data => data.id !== this._socket.id), tap(() => console.log('userjoined')));
  }

  userLeft$(): Observable<RoomEvent> {
    return this.leaveRoomEvent$
      .pipe(filter(data => data.id !== this._socket.id), tap(() => console.log('userleft')));
  }

  private get joinRoomEvent$(): Observable<RoomEvent> {
    return this._socket.listen$(RoomMessage.JoinRoom).pipe(share());
  }

  private get leaveRoomEvent$(): Observable<RoomEvent> {
    return this._socket.listen$(RoomMessage.LeaveRoom).pipe(share());
  }

}
