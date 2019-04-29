var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var Rx = require('rxjs/Rx');

server.listen(process.env.PORT | 7017);

const CANVAS_HEIGHT = 680;
const CANVAS_WIDTH = 900;
const MOVE_PIXEL = 5;
const PLAYER_SIZE = 60;
const BULLET_SIZE = 8;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use('/public', express.static(__dirname + '/public'));

var usersList = [];
var interval = 0;
var bulletsInterval = 0;
var availableColors = ['green', 'red', 'blue', 'yellow', 'orange', 'cyan', 'pink', 'gray'];

var findPlayerA = function () {
  return usersList.find(usr => usr.player === 'A');
}

var findNextPlayerColor = function () {
  var usedColors = usersList.map(user => user.color);
  var playerColor = '';


  for (var i = 0; i < availableColors.length; i++) {
    if (usedColors.indexOf(availableColors[i]) === -1) {
      playerColor = availableColors[i];
      return playerColor;
    }
  }

  return '';
}

var setCoordinate = function (coord) {
  if (coord % MOVE_PIXEL === 0) {
    return coord;
  } else {
     return setCoordinate(coord + 1);
  }
}

var findNextPlayerPosition = function (playerId) {
  var findRandX = setCoordinate(Math.ceil(Math.random() * CANVAS_WIDTH));
  var findRandY = setCoordinate(Math.ceil(Math.random() * CANVAS_HEIGHT));

  var userObject = {
    pos: [findRandX, findRandY],
    id: 'undefinedPlayer'
  }

  if (usersList.length === 0) {
    return [findRandX, findRandY];
  }

  var collision = checkPlayerColision(userObject, 'LEFT') ||
    checkPlayerColision(userObject, 'UP') ||
    checkPlayerColision(userObject, 'RIGHT') ||
    checkPlayerColision(userObject, 'DOWN');

  if (collision) {
    findNextPlayerPosition(playerId);
  } else {
    return [findRandX, findRandY];
  }
}



var addAPlayer = function (socket) {
  var playerColor = findNextPlayerColor();

  const user = {
    'id': socket.id,
    'score': 0,
    'pos': findNextPlayerPosition(socket.id),
    'size': PLAYER_SIZE,
    'color': playerColor,
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
  if(!player) {
    return;
  }
  var otherPlayers = usersList.filter(usr => usr.id !== player.id);

  if (otherPlayers.length) {
    const w = PLAYER_SIZE;
    const h = PLAYER_SIZE;


    for (var i = 0; i < otherPlayers.length; i++) {
      if(otherPlayers[i] && otherPlayers[i].pos) {
        let dx = player.pos[0] - otherPlayers[i].pos[0];
        let dy = player.pos[1] - otherPlayers[i].pos[1];
  
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
  
          if (wy > hx) {
            if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
              /* collision at the top */
              return true;
            }
            if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
              /* on the right */
              return true;
            }
          } else {
            if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
              /* on the left */
              return true;
            }
            if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
              /* at the bottom */
              return true;
            }
          }
        }
      }
      
      
    }
  } else {
    return false;
  }
}

var bulletsList = [];

var makeBullet = function (playerId) {
  const user = usersList.find((user) => {
    return user.id === playerId;
  })

  const bullet = {
    'playerId': user.id,
    'pos': getBulletPos(user),
    'size': BULLET_SIZE,
    'direction': user.direction
  };
  bulletsList.push(bullet);

  setBulletsInterval();
}

var getBulletPos = function (user) {
  let posX = user.pos[0];

  switch (user.direction) {
    case 'LEFT':
      posX -= user.size / 2 + BULLET_SIZE / 2;
      break;
    case 'RIGHT':
      posX += user.size / 2 + BULLET_SIZE / 2;
      break;
    default:
      break;
  }

  let posY = user.pos[1];

  switch (user.direction) {
    case 'UP':
      posY -= user.size / 2 + BULLET_SIZE / 2;
      break;
    case 'DOWN':
      posY += user.size / 2 + BULLET_SIZE / 2;
      break;
    default:
      break;
  }

  return [posX, posY];
}

var setBulletsInterval = function () {

  if (!bulletsInterval) {
    bulletsInterval = setInterval(() => {
      // console.log(bulletsList);
      
      bulletsList.map(bullet => {
        switch (bullet.direction) {
          case 'LEFT':
            bullet.pos[0] -= 8;
            break;
          case 'UP':
            bullet.pos[1] -= 8;
            break;
          case 'RIGHT':
            bullet.pos[0] += 8;
            break;
          case 'DOWN':
            bullet.pos[1] += 8;
            break;
          default:
            break;
        }
        if(bullet) {
          let whoWasHit = checkBulletCollision(bullet);

          if (whoWasHit) {
            bullet.destroyed = 1;

            usersList.map(user => {
              if(user.id === bullet.playerId) {
                user.score += 1;
              }
            });

            updateScores();
          }

        }
      })

      bulletsList = bulletsList.filter(bullet => {
        return (bullet.pos[0] < CANVAS_WIDTH && bullet.pos[0] > 0 && bullet.pos[1] < CANVAS_HEIGHT && bullet.pos[1] > 0) && !bullet.destroyed;
      });
    }, 20);
  }
}

var checkBulletCollision = function (bullet) {
  var otherPlayers = usersList;

  if (otherPlayers.length) {
    const w = BULLET_SIZE;
    const h = BULLET_SIZE;


    for (var i = 0; i < otherPlayers.length; i++) {
      let dx = bullet.pos[0] - otherPlayers[i].pos[0];
      let dy = bullet.pos[1] - otherPlayers[i].pos[1];

      if (Math.abs(dx) <= w + 22 && Math.abs(dy) <= h + 22) {
        /* collision! */
        const wy = w * dy;
        const hx = h * dx;

        if (wy > hx) {
          
          if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
            /* collision at the top */
            return otherPlayers[i];
          }
          if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
            /* on the right */
            return otherPlayers[i];
          }
        } else {
          if (wy > -hx && Math.abs(wy) !== Math.abs(hx)) {
            /* on the left */
            return otherPlayers[i];
          }
          if (wy < -hx && Math.abs(wy) !== Math.abs(hx)) {
            /* at the bottom */
            return otherPlayers[i];
          }
        }
      }
    }
  }
}

var updateScores = function () {
  var scoresBoard = usersList.map(user => {
    return {
      'color' : user.color,
      'score' : user.score
    }
  }).sort((a, b) => {
    if (a.score > b.score) {
      return -1;
    } else {
      return 1;
    }
  })

  io.emit('updateScore', scoresBoard);
}


/* socket.io part */

io.sockets.on('connection', function (socket) {

  if (usersList.length < availableColors.length) {
    addAPlayer(socket);
    updateScores();
  }

  const userFound = usersList.find(usr => usr.id === socket.id);

  if (!userFound) {
    socket.emit('emitPrompt', {
      msg: 'Proszę stąd wykurwiać, jest już ośmiu graczy.'
    })
  }

  Rx.Observable.fromEvent(socket, 'moveUser')
    .pipe(
      Rx.operators.throttleTime(30)
    )
    .forEach((msg) => {
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
      io.emit('updateCanvas', {
        usersList: usersList,
        bulletsList: bulletsList
      });
    })

  Rx.Observable.fromEvent(socket, 'shoot')
    .pipe(
      Rx.operators.throttleTime(1000)
    )
    .forEach((msg) => {
      makeBullet(msg.id);
    })

  if (!interval) {
    interval = setInterval(() => {
      io.emit('updateCanvas', {
        usersList: usersList,
        bulletsList: bulletsList
      });
    }, 100);
  }

  socket.on('userLeave', (data) => {
    usersList = usersList.filter((user) => {
      return user.id !== data.id;
    });

    updateScores();

    if (usersList.length === 0) {
      clearInterval(interval);
      interval = 0;
    }
  })

});