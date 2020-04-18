const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('user connected');
  socket.broadcast.emit('connected', 'user connected');

  socket.on('image', (data) => {
    socket.broadcast.emit('image', data);
  });

  socket.on('disconnect', (reson) => {
    console.log('user disconnected');
    socket.broadcast.emit('disconnected', 'user disconnected');
  })

});

server.listen(3000);
