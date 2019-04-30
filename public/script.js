'use strict';

var socket = io();

var keyState = {};
var keyStateValue = null;

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var socketId = '';

var pewSound = new Audio('/public/pew.mp3');

var soundSwitch = document.getElementById('sound-switch');
var isSoundOn = true;

soundSwitch.addEventListener('click', function() {
  isSoundOn = !isSoundOn;
  isSoundOn ? soundSwitch.classList.add('options-item__switch--on') : soundSwitch.classList.remove('options-item__switch--on');
});

var imageGreen = new Image(60, 60);
imageGreen.src = '/public/tank_green_sprite.png';
var imageRed = new Image(60, 60);
imageRed.src = '/public/tank_red_sprite.png';
var imageYellow = new Image(60, 60);
imageYellow.src = '/public/tank_yellow_sprite.png';
var imageBlue = new Image(60, 60);
imageBlue.src = '/public/tank_blue_sprite.png';
var imageOrange = new Image(60, 60);
imageOrange.src = '/public/tank_orange_sprite.png';
var imageCyan = new Image(60, 60);
imageCyan.src = '/public/tank_cyan_sprite.png';
var imagePink = new Image(60, 60);
imagePink.src = '/public/tank_pink_sprite.png';
var imageGray = new Image(60, 60);
imageGray.src = '/public/tank_gray_sprite.png';

var updatePlayerPos = function updatePlayerPos(user) {
  var img = '';
  switch (user.color) {
    case 'green':
      img = imageGreen;
      break;
    case 'red':
      img = imageRed;
      break;
    case 'yellow':
      img = imageYellow;
      break;
    case 'blue':
      img = imageBlue;
      break;
    case 'orange':
      img = imageOrange;
      break;
    case 'cyan':
      img = imageCyan;
      break;
    case 'pink':
      img = imagePink
      break;
    case 'gray':
      img = imageGray;
      break;
    default:
      break;
  }

  var shift = 0;
  switch (user.direction) {
    case 'LEFT':
      shift = 60;
      break;
    case 'UP':
      shift = 120;
      break;
    case 'RIGHT':
      shift = 180;
      break;
    case 'DOWN':
      shift = 0;
      break;
    default:
      break;
  }
  if (user.size && user.pos) {
    context.drawImage(img, shift, 0, 60, 60, user.pos[0] - user.size / 2, user.pos[1] - user.size / 2, 60, 60);
  }
};

var updateBulletPos = function updateBulletPos(bullet) {
  context.fillRect(bullet.pos[0] - bullet.size / 2, bullet.pos[1] - bullet.size / 2, 8, 8);
};

var updateCanvasEmit = function updateCanvasEmit(objectsArray) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < objectsArray.usersList.length; i++) {
    updatePlayerPos(objectsArray.usersList[i]);
  }

  for (var _i = 0; _i < objectsArray.bulletsList.length; _i++) {
    updateBulletPos(objectsArray.bulletsList[_i]);
  }
};

socket.on('playerConnected', function (id) {
  socketId = id;
});

socket.on('appendRect', function (user) {
  updatePlayerPos(user);
});

socket.on('updateCanvas', function (objectsArray) {
  updateCanvasEmit(objectsArray);
});

socket.on('emitPrompt', function (data) {
  window.alert(data.msg);
});

socket.on('updateScore', function (scoreboard) {
  document.getElementById('leaderboardList').innerHTML = "";

  scoreboard.forEach(function (el) {
    var listElement = document.createElement('div');
    listElement.classList.add('leaderboard-list__item');
    listElement.innerHTML = '<span class="' + el.color + '">' + el.name + '</span>: ' + el.score;
    document.getElementById('leaderboardList').appendChild(listElement);
  });
});

socket.on('nickNeeded', function () {
  var nickPrompt = prompt("Podaj swój nick");
  if (nickPrompt) {
    socket.emit('nickGive', nickPrompt);
  }
});

var playPewSound = function () {
  if (isSoundOn) {
    pewSound.play();
  }
};

socket.on('pewSound', function() {
  console.log(isSoundOn);
  playPewSound();
});

window.onbeforeunload = function (e) {
  socket.emit('userLeave', {
    id: socketId
  });
};

window.onkeydown = function(event) {
  if (socketId && [32, 37, 38, 39, 40].indexOf(event.which) > -1) {
    keyState[event.which] = true;
    keyStateValue = event.keyCode || event.which;
  }
}

window.onkeyup = function(event) {
  if (socketId && [32, 37, 38, 39, 40].indexOf(event.which) > -1) {
    keyState[event.which] = false;
    keyStateValue = null;
  }
}

var gameLoop = function() {
  if (keyState[37] || keyState[38] || keyState[39] || keyState[40]) {
    socket.emit('moveUser', {
      id: socketId,
      direction: keyStateValue
    });
  }

  if (keyState[32]) {
    socket.emit('shoot', {
      id: socketId
    });
  }

  setTimeout(function() {
    gameLoop();
  }, 10)
}

gameLoop();