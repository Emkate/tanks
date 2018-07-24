const socket = io();

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

var socketId = '';

var imageGreen = new Image(60, 60);
imageGreen.src = '/public/tank_green_sprite.png';
var imageRed = new Image(60, 60);
imageRed.src = '/public/tank_red_sprite.png';
var imageYellow = new Image(60, 60);
imageYellow.src = '/public/tank_yellow_sprite.png';
var imageBlue = new Image(60, 60);
imageBlue.src = '/public/tank_blue_sprite.png';


var updatePlayerPos = (user) => {
  console.log(user);
  
  let img = '';
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
    default:
      break;
  }

  let shift = 0;
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
  context.drawImage(img, shift, 0, 60, 60, user.pos[0] - user.size / 2, user.pos[1] - user.size / 2, 60, 60);
}

var updateBulletPos = (bullet) => {
  context.fillRect(bullet.pos[0] - bullet.size / 2, bullet.pos[1] - bullet.size / 2, 8, 8);
}

var updateCanvasEmit = (objectsArray) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < objectsArray.usersList.length; i++) {
    updatePlayerPos(objectsArray.usersList[i]);
  }

  for (let i = 0; i < objectsArray.bulletsList.length; i++) {
    updateBulletPos(objectsArray.bulletsList[i]);
  }
}

socket.on('playerConnected', (id) => {
  socketId = id;
})

socket.on('appendRect', (user) => {
  updatePlayerPos(user);
});

socket.on('updateCanvas', (objectsArray) => {
  updateCanvasEmit(objectsArray);
});

socket.on('emitPrompt', (data) => {
  window.alert(data.msg);
})

window.onbeforeunload = (e) => {
  socket.emit('userLeave', {
    id: socketId
  });
}

document.addEventListener('keydown', (event) => {
  if(socketId) {
    if ([37, 38, 39, 40].indexOf(event.which) > -1) {
      socket.emit('moveUser', {
        id: socketId,
        direction: event.which
      })
    }
  
    if (event.which === 32) {
      socket.emit('shoot', {
        id: socketId
      })
    }
  }
});