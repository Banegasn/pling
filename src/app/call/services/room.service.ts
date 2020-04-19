import { Injectable } from '@angular/core';
import { SocketioService } from 'src/app/services/socketio.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private _socket: SocketioService) { }

  joinRoom(room: string): void {
    this._socket.emit('join-room', {room, id: this._socket.id});
  }

  leaveRoom(room: string): void {
    this._socket.emit('leave-room', {room, id: this._socket.id});
  }

}
