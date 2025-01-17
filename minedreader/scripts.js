let canvas;
let ctx;
const state = {
  "player": {
    "position": [0, 0],
    "strength": 100,
    "movement": [0, 0]
  },
  "moles": [
    {
      "position": [10, 5],
      "strength": 20,
      "movement": [0, 0]
    },
    {
      "position": [15, 8],
      "strength": 20,
      "movement": [0, 0]
    }
  ],
  "weasels": [
    {
      "position": [20, 12],
      "strength": 20,
      "movement": [0, 0]
    },
    {
      "position": [25, 15],
      "strength": 20,
      "movement": [0, 0]
    }
  ]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function main() {
  // Initialize any variables or state here
  canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
  } else {
    throw new Error('Canvas not supported');
  }

  // Start the animation loop
  requestAnimationFrame(animate);
}

function updatePositions() {
  const { width, height } = canvas;
  const { player, moles, weasels } = state;
  // player.position[0] += 1;
  // player.position[1] += 1;
  moles.forEach(mole => {
    // 30% chance of updating the movement vector by a small amount 
    if (Math.random() > 0.1) {
        mole.movement[0] += randomInt(-1, 1);
        mole.movement[1] += randomInt(-1, 1);
    }
    // 30% chance of moving the mole by the movement vector
    if (Math.random() > 0.1) {
      mole.position[0] += mole.movement[0];
      mole.position[1] += mole.movement[1];
    }
    // Handle if the mole is out of bounds
    if (mole.position[0] < 0 || mole.position[0] > width) {
      mole.movement[0] *= -1;
    }
    if (mole.position[1] < 0 || mole.position[1] > height) {
      mole.movement[1] *= -1;
    }
  });
  weasels.forEach(weasel => {
    if (Math.random() > 0.1) {
        weasel.movement[0] += randomInt(-1, 1);
        weasel.movement[1] += randomInt(-1, 1);
    }
    
    if (Math.random() > 0.1) {
      weasel.position[0] += 1;
      weasel.position[1] += 1;
    }
    if (weasel.position[0] < 0 || weasel.position[0] > width) {
      weasel.movement[0] *= -1;
    }
    if (weasel.position[1] < 0 || weasel.position[1] > height) {
      weasel.movement[1] *= -1;
    }
  });
}

// Put animation logic here
function animate(timestamp) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  const { player, moles, weasels } = state;
  const playerSize = [10,20];
  ctx.fillStyle = 'white';
  ctx.fillRect(player.position[0], player.position[1], playerSize[0], playerSize[1]);

  // Draw moles
  ctx.fillStyle = 'green';
  moles.forEach(mole => {
    ctx.fillRect(mole.position[0], mole.position[1], 10, 10);
  });

  // Draw weasels
  ctx.fillStyle = 'red';
  weasels.forEach(weasel => {
    ctx.fillRect(weasel.position[0], weasel.position[1], 10, 10);
  });

  updatePositions();

  // Request the next frame
  requestAnimationFrame(animate);
}

// Call main when the script loads
document.addEventListener('DOMContentLoaded', main);