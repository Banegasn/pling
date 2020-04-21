import express from 'express';
import * as path from 'path';
import * as http from "http";
import { SocketServer } from './sockets/server';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const clientPath = __dirname + '../../../client/dist/app-pling';

app.use(express.static(clientPath));

app.get('/*', (_, res) => {
    res.sendFile(path.join(clientPath + '/index.html'));
});

new SocketServer(server);

server.listen(port, () => {
    console.log("Running server on port %s", port);
});
