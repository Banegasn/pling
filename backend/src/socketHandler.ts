import socketio from 'socket.io';
import { Room } from './room';

export class SocketHandler {

  socketServer: socketio.Server;
  rooms: Room[];

  constructor(socketServer: socketio.Server) {
    this.socketServer = socketServer;
    this.rooms = [];
  }

  listen(): void {
    this.socketServer.on('connection', (socket) => {
      console.log('user connected');

      socket.on('join-room', (data) => {
        const users = this.getRoom(data.room).addUser(data.id).users;
        socket.join(data.room);
        socket.to(data.room).emit('join-room', {...data, users});

        console.log('someone has joined the room', data, this.rooms);
      });

      socket.on('leave-room', (data) => {
        const users = this.getRoom(data.room).deleteUser(data.id).users;
        socket.leave(data.room);
        socket.to(data.room).emit('leave-room', {...data, users});

        console.log('someone has left the room', data, this.rooms);
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.broadcast.emit('disconnected', 'user disconnected');
      });

    });
  }

  getRoom(id: string): Room {
    let result = this.rooms.find(room => room.id === id);
    if (!result) {
      result = new Room(id);
      this.rooms.push(result);
    }
    return result;
  }

}
