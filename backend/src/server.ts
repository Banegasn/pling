import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';

const app = express();
const server = new http.Server(app);
const io = socketio(server);

io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('join-room', (data) => {
    console.log('someone has joined the room', data.room);
    socket.broadcast.emit('image', data);
  });

  socket.on('leave-room', (data) => {
    console.log('someone has left the room', data.room);
    socket.broadcast.emit('image', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.broadcast.emit('disconnected', 'user disconnected');
  });

});

server.listen(3000);
