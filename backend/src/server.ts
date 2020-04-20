import express from 'express';
import socketio from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import { SocketHandler } from './socketHandler';

const app = express();
const server = new http.Server(app);
const io = socketio(server);
const socketHandler = new SocketHandler(io);
const port = process.env.PORT || 8080;

socketHandler.listen();

app.use(express.static(__dirname + '../../../client/dist/app-pling'));

app.get('/*', (_, res) => {
    res.sendFile(path.join(__dirname + '../../../client/dist/app-pling/index.html'));
});

app.listen(port);
server.listen(3000);
