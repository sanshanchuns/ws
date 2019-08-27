'use strict';

const session = require('express-session');
const express = require('express');
const http = require('http');
const uuid = require('uuid');

const WebSocket = require('../..');

const app = express();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', function(req, res) {
  //
  // "Log in" user and set userId to session.
  //
  const id = uuid.v4();

  console.log(`Updating session for user ${id}`);
  req.session.userId = id;
  res.send({ result: 'OK', data: 'Session updated' });
});

app.delete('/logout', function(request, response) {
  console.log('Destroying session');
  request.session.destroy(function() {
    response.send({ result: 'OK', data: 'Session destroyed' });
  });
});

//
// Create HTTP server by ourselves.
//
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', function(request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    wss.handleUpgrade(request, socket, head, function(ws) {
      wss.emit('connection', ws, request);
    });
  });
});

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', function(ws, request) {
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      // if (client !== ws && client.readyState === WebSocket.OPEN) {
        const orig = JSON.parse(data)

        switch (orig.cmd) {
          case 11:
            // 反馈客户端服务器已经收到消息
              const response = {...orig, cmd:12};
              client.send(JSON.stringify(response));
            break;
          case 23:
            // 反馈客户端服务器已经收到需要更新最后已读的消息
              const lastRead = {msg:'ok', cmd:24};
              client.send(JSON.stringify(lastRead));
            break;
          default:
            break;
        }

        // 发送消息给客户端
        const message = {...orig, cmd:11};
        client.send(JSON.stringify(message));

        // 推送聊天对象在线状态
        const friendStatus = {data:{userId:1000, status:1}, cmd:22};
        client.send(JSON.stringify(friendStatus));
      // }
    });
  });
});

// const interval = setInterval(function ping() {
//   wss.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) return ws.terminate();

//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 1000);
//
// Start the server.
//
server.listen(8080, function() {
  console.log('Listening on http://localhost:8080');
});
