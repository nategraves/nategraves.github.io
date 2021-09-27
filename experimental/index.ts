import { Application, Graphics, autoDetectRenderer, TextStyle, Text, Sprite } from 'pixi.js'
import { MembraneSynth } from 'tone';

const { innerWidth: width, innerHeight: height } = window;
let keyDown;
const cursorRadius = 50;
const cursorDiameter = cursorRadius * 2;
const speed = 10;
const margin = 20;
let direction = { x: 0, y: 0 };
let position = { x: (width / 2) - (cursorRadius / 2), y: (height / 2) - (cursorRadius / 2) };
const maxWidth = width - cursorDiameter - margin;
const maxHeight = height - cursorDiameter - margin;
const synth = new MembraneSynth().toDestination();
synth.volume.value = -10;

const down = ({ code }) => {
  switch(code) {
    case 'ArrowLeft':
    case 'KeyA':
      direction.x = -1 * speed;
      break;
    case 'ArrowRight':
    case 'KeyD':
      direction.x = 1 * speed;
      break;
    case 'ArrowUp':
    case 'KeyW':
      direction.y = -1 * speed;
      break;
    case 'ArrowDown':
    case 'KeyS':
      direction.y = 1 * speed;
      break;
    default:
      keyDown = code;
      break;
  }
}

const up = ({ code }) => {
  keyDown = undefined
  switch(code) {
    case 'ArrowLeft':
    case 'KeyA':
    case 'ArrowRight':
    case 'KeyD':
      direction.x = 0;
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'ArrowDown':
    case 'KeyS':
      direction.y = 0;
      break;
    default:
      keyDown = code;
      break;
  }
}

document.addEventListener('keydown', down);

document.addEventListener('keypress', down);

document.addEventListener('keyup', up);

let app = new Application({ width: width - margin, height: height - margin });
document.body.appendChild(app.view);

const cursorGraphic = new Graphics();
// Draw cursor
cursorGraphic.beginFill('0xff2222');
cursorGraphic.drawCircle(position.x, position.y, cursorRadius);
cursorGraphic.endFill();
const renderer = autoDetectRenderer();

const texture = app.renderer.generateTexture(cursorGraphic);
const cursor = new Sprite(texture);
app.stage.addChild(cursor);


const basicStyle = new TextStyle({
  fontSize: 18,
  fill: ['#ffffff'],
});
const basicText = new Text(`KeyDown: ${keyDown}`, basicStyle);
basicText.x = 20;
basicText.y = 20;
app.stage.addChild(basicText);

let elapsed = 0.0;
let bonking = false;

const bonk = () => {
  if (bonking) {
    return;
  }

  bonking = true;
  synth.triggerAttackRelease('c4', '8n');
  setTimeout(() => bonking = false, 100)
}

app.ticker.add((delta) => {
  elapsed += delta;

  position.x = position.x + direction.x;
  position.y = position.y + direction.y;

  console.log(position, direction)
  if (position.x < 0) {
    position.x = 0;
    bonk();
  }

  if (position.x > maxWidth) {
    position.x = maxWidth;
    bonk();
  }

  if (position.y < 0) {
    position.y = 0;
    bonk();
  }

  if (position.y > maxHeight) {
    position.y = maxHeight;
    bonk();
  }

  cursor.x = position.x;
  cursor.y = position.y;

  basicText.text = `KeyDown: ${keyDown ? keyDown : ''}`;
});
