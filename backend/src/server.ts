import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
import { SocketHandler } from './socketHandler';

const app = express();
const server = new http.Server(app);
const io = socketio(server);
const socketHandler = new SocketHandler(io);

socketHandler.listen();
server.listen(3000);
