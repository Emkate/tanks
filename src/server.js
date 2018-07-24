

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var fromEvent = require('rxjs/Observable/fromEvent');

server.listen(process.env.PORT | 7017);

const CANVAS_HEIGHT = 680;
const CANVAS_WIDTH = 900;
const MOVE_PIXEL = 5;
const PLAYER_SIZE = 60;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use('/public', express.static(__dirname + '/public'));

var usersList = [];
var interval = 0;

var findPlayerA = function () {
  return usersList.find(usr => usr.player === 'A');
}

var addAPlayer = function (socket) {
  const user = {
    'id': socket.id,
    'score': 0,
    'player': findPlayerA() ? 'B' : 'A',
    'pos': findPlayerA() ? [PLAYER_SIZE * 6, PLAYER_SIZE * 6] : [PLAYER_SIZE, PLAYER_SIZE],
    'size': PLAYER_SIZE,
    'color': findPlayerA() ? 'green' : 'red',
    'direction': 'UP'
  };
  usersList.push(user);

  socket.emit('playerConnected', socket.id);
  io.emit('appendRect', user);
}

var moveLeft = function (userId) {
  const user = usersList.find(usr => usr.id === userId);
  if ((user.pos[0] - PLAYER_SIZE / 2 > 0) && !checkPlayerColision(user, 'LEFT')) {
    user.direction = 'LEFT';
    user.pos[0] -= MOVE_PIXEL
  }
}

var moveUp = function (userId) {
  const user = usersList.find(usr => usr.id === userId);
  if (((user.pos[1] - PLAYER_SIZE / 2) > 0) && !checkPlayerColision(user, 'UP')) {
    user.direction = 'UP';
    user.pos[1] -= MOVE_PIXEL
  }
}

var moveRight = function (userId) {
  const user = usersList.find(usr => usr.id === userId);
  if ((user.pos[0] + PLAYER_SIZE / 2 < CANVAS_WIDTH) && !checkPlayerColision(user, 'RIGHT')) {
    user.direction = 'RIGHT';
    user.pos[0] += MOVE_PIXEL
  }
}

var moveDown = function (userId) {
  const user = usersList.find(usr => usr.id === userId);
  if ((user.pos[1] + PLAYER_SIZE / 2 < CANVAS_HEIGHT) && !checkPlayerColision(user, 'DOWN')) {
    user.direction = 'DOWN';
    user.pos[1] += MOVE_PIXEL
  }
}

var checkPlayerColision = function (player, direction) {
  var otherPlayer = usersList.find(usr => usr.id !== player.id);

  if (otherPlayer) {
    const w = PLAYER_SIZE;
    const h = PLAYER_SIZE;
    let dx = player.pos[0] - otherPlayer.pos[0];
    let dy = player.pos[1] - otherPlayer.pos[1];

    switch (direction) {
      case 'LEFT':
        dx -= 3;
        break;
      case 'UP':
        dy -= 3;
        break;
      case 'RIGHT':
        dx += 3;
        break;
      case 'DOWN':
        dy += 3;
        break;
      default:
        break;
    }

    if (Math.abs(dx) <= w - 3 && Math.abs(dy) <= h - 3) {
      /* collision! */
      const wy = w * dy;
      const hx = h * dx;

      // console.log('collision')

      if (wy > hx) {
        if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
          /* collision at the top */
          // console.log('colision at the top', wy, -hx)
          return true;
        }
        if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
          /* on the right */
          // console.log('colision at the right', wy, -hx)
          return true;
        }
      } else {
        if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
          /* on the left */
          // console.log('colision at the left', wy, -hx)
          return true;

        }
        if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
          /* at the bottom */
          // console.log('colision at the bottom', wy, -hx)
          return true;

        }
      }
    }
  }
}


/* socket.io part */

io.sockets.on('connection', function (socket) {

  if (usersList.length < 2) {
    addAPlayer(socket);
  } else {

  }

  const userFound = usersList.find(usr => usr.id === socket.id);

  if (!userFound) {
    socket.emit('emitPrompt', {
      msg: 'Proszę stąd wykurwiać, jest już dwóch graczy.'
    })
  }

  fromEvent(socket, 'moveUser')
  .map((data) => {
    console.log('elo elo');
  })

  socket.on('moveUser', (msg) => {
    if (userFound) {
      switch (msg.direction) {
        case 37:
          moveLeft(msg.id);
          break;
        case 38:
          moveUp(msg.id);
          break;
        case 39:
          moveRight(msg.id);
          break;
        case 40:
          moveDown(msg.id);
          break;
        default:
          break;
      }
      io.emit('updateCanvas', usersList);
    }

  });

  if (!interval) {
    interval = setInterval(() => {
      io.emit('updateCanvas', usersList);
    }, 500);
  }

  socket.on('userLeave', (data) => {
    usersList = usersList.filter((user) => {
      return user.id !== data.id;
    });

    if (usersList.length === 0) {
      clearInterval(interval);
      interval = 0;
    }
  })

});