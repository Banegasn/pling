import socketio from 'socket.io';
import { Room } from './room';

export class SocketHandler {

  io: socketio.Server;
  rooms: Room[];

  constructor(socketServer: socketio.Server) {
    this.io = socketServer;
    this.rooms = [];
  }

  listen(): void {
    this.io.on('connection', (socket) => {
      console.log('user connected');

      socket.on('join-room', (data) => {
        const users = this.getRoom(data.room).addUser(socket.id).users;
        socket.join(data.room);
        this.io.in(data.room).emit('join-room', {...data, users, id: socket.id});
      });

      socket.on('leave-room', (data) => {
        const users = this.getRoom(data.room).deleteUser(socket.id).users;
        socket.leave(data.room);
        socket.in(data.room).emit('leave-room', {...data, users, id: socket.id});
      });

      socket.on('peer-message', data => {
        socket.to(data.room).broadcast.emit('peer-message', {
          ...data,
          by: socket.id
        });
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
        this.rooms
          .filter(room => room.users.find(user => user === socket.id))
          .map(room => {
            room.deleteUser(socket.id);
            socket.in(room.id).emit('leave-room', {users: room.users, id: socket.id});
          });
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
