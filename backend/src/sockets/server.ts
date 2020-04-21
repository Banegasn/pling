import socketio from 'socket.io';
import * as http from "http";
import { Room } from '../shared/room';
import { MESSAGES } from './messages.model';

export class SocketServer {

  io: socketio.Server;
  rooms: Room[];

  constructor(server: http.Server) {
    this.io = socketio(server, { origins: '*:*'});;
    this.rooms = [];
    this.listen();
  }

  listen(): void {
    this.io.on(MESSAGES.CONNECTION, (socket) => {
      console.log('user connected');
      this.listenJoinRoom(socket);
      this.listenLeaveRoom(socket);
      this.listenPeerMessage(socket);
      this.listenDisconnect(socket);
    });
  }

  private listenPeerMessage(socket: socketio.Socket): void {
    socket.on(MESSAGES.PEER, data => {
      socket.to(data.room).broadcast.emit(MESSAGES.PEER, {
        ...data,
        by: socket.id
      });
    });
  }

  private listenDisconnect(socket: socketio.Socket): void {
    socket.on(MESSAGES.DISCONNECT, () => {
      console.log('user disconnected');
      this.rooms
        .filter(room => room.users.find(user => user === socket.id))
        .map(room => {
          room.deleteUser(socket.id);
          socket.in(room.id).emit(MESSAGES.LEAVE_ROOM, { users: room.users, id: socket.id });
        });
      socket.broadcast.emit('disconnected', 'user disconnected');
    });
  }

  private listenLeaveRoom(socket: socketio.Socket): void {
    socket.on(MESSAGES.LEAVE_ROOM, (data) => {
      const users = this.getRoom(data.room).deleteUser(socket.id).users;
      socket.leave(data.room);
      socket.in(data.room).emit(MESSAGES.LEAVE_ROOM, { ...data, users, id: socket.id });
    });
  }

  private listenJoinRoom(socket: socketio.Socket): void {
    socket.on(MESSAGES.JOIN_ROOM, (data) => {
      const users = this.getRoom(data.room).addUser(socket.id).users;
      socket.join(data.room);
      this.io.in(data.room).emit(MESSAGES.JOIN_ROOM, { ...data, users, id: socket.id });
    });
  }

  private getRoom(id: string): Room {
    let result = this.rooms.find(room => room.id === id);
    if (!result) {
      result = new Room(id);
      this.rooms.push(result);
    }
    return result;
  }

}
