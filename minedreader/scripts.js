let canvas;
let ctx;

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

// Put animation logic here
function animate(timestamp) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'black';
  ctx.drawRect(0, 0, width, height);
  const { player, moles, weasels } = state;
  const playerSize = [10,20];
  ctx.fillStyle = 'white';
  ctx.drawRect(player.position[0], player.position[1], playerSize[0], playerSize[1]);
  console.log(player.position);
  
  // Request the next frame
  requestAnimationFrame(animate);
}

// Call main when the script loads
document.addEventListener('DOMContentLoaded', main);