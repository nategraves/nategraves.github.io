const _gameWidth = 1000;
const _gameHeight = 700;
const _leftFlagOrigin = { x: 170, y: 585 };
const _rightFlagOrigin = { x: 150, y: 585 };
const _maxFlagDistance = 75;
const _fudge = 0.1;
const _lpositions = {
  l1: { X: 0.5, Y: 0.95 },
  l2: { X: -0.75, Y: 0.8 },
  l3: { X: -0.95, Y: 0 },
  l4: { X: 0.75, Y: -0.8 },
  l5: { X: 0.5, Y: -0.95 },
  l6: { X: 0.75, Y: 0.8 },
  l7: { X: 1, Y: 0 },
};
const _rpositions = {
  r1: { X: 0.5, Y: 0.95 },
  r2: { X: 0.75, Y: 0.8 },
  r3: { X: 0.95, Y: 0 },
  r4: { X: -0.75, Y: -0.8 },
  r5: { X: 0.5, Y: -0.95 },
  r6: { X: -0.75, Y: 0.8 },
  r7: { X: -1, Y: 0 },
}
const _alphabet = {
  l1r1: '.', l2r1: 'A', l3r1: 'B', l4r1: 'C', l5r1: 'D',
  l1r4: 'E', l1r3: 'F', l1r2: 'G', l3r6: 'H', l4r6: 'I',
  l5r3: 'J', l2r5: 'K', l2r4: 'L', l2r3: 'M', l2r2: 'N',
  l4r7: 'O', l3r5: 'P', l3r4: 'Q', l3r3: 'R', l3r2: 'S',
  l4r1: 'T', l4r4: 'U', l5r2: 'V', l7r4: 'W', l6r4: 'X',
  l4r3: 'Y', l6r3: 'Y', l5r4: '#', l4r1: '>' 
};
const _numerals = {
  l2r1: '1', l3r1: '2', l4r1: '3', l5r1: '4', l1r4: '5',
  l1r3: '6', l1r2: '7', l3r6: '8', l4r6: '9', l5r3: '0'
}
const _game = new Phaser.Game(
  _gameWidth, _gameHeight, Phaser.AUTO, '',
  { preload: preload, create: create, update: update }
)

let _numeralMode = false;
let _myChar = '';
let _myTxt = '';
let _urChar = '';
let _urTxt = '';

let _pad, _frietnd, _leftFlag, _leftArm,
    _rightFlag, _rightArm, _flags, _leftStickX,
    _leftStickY, _leftTrigger, _rightStickX,
    _rightStickY, _rightTrigger;

function preload() {
  _game.load.image('bg', 'bg.png');
  _game.load.image('friend', 'friend.png');
  _game.load.image('flagLeft', 'flagLeft.png');
  _game.load.image('flagRight', 'flagRight.png');
  _game.input.gamepad.start();
}

function create() {
  _game.add.sprite(0, 0, 'bg');

  _friend = _game.add.sprite(185, 500, 'friend');
  _friend.anchor.setTo(0.5, 0);
  _friend.alpha = 0.5;

  _leftFlag = _game.add.sprite(_leftFlagOrigin.x, _leftFlagOrigin.y, 'flagLeft');
  _leftFlag.anchor.setTo(1, 1);

  _rightFlag = _game.add.sprite(_rightFlagOrigin.x, _rightFlagOrigin.y, 'flagRight');
  _rightFlag.anchor.setTo(-1, 1);

  _flags = _game.add.group();
  _flags.add(_leftFlag);
  _flags.add(_rightFlag);

  _game.world.bringToTop(_friend);

  _myTxt = _game.add.text(
    _game.world.centerX, _game.world.centerY,
    _myChar,
    { font: "200px Arial", fill: "#ffffff", align: "center" }
  ); 

  _pad = _game.input.gamepad.pad1;
  _pad.onConnect = listenerSetup;

  _game.input.keyboard.onPressCallback = keypressHandler;

  _game.input.gamepad.start();
}

function listenerSetup() {
  leftTriggerButton = _pad.getButton(Phaser.Gamepad.XBOX360_LEFT_TRIGGER);

  leftTriggerButton.onDown.add(onLeftTrigger);
  leftTriggerButton.onUp.add(onLeftTrigger);
  leftTriggerButton.onFloat.add(onLeftTrigger);

  rightTriggerButton = _pad.getButton(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER);

  rightTriggerButton.onDown.add(onRightTrigger);
  rightTriggerButton.onUp.add(onRightTrigger);
  rightTriggerButton.onFloat.add(onRightTrigger);
}

function keypressHandler(char) {
  const pos = alphaToFlag(char);

  if (pos === '') return;

  const leftPos = _lpositions[pos.substr(0, 2)];
  const rightPos = _rpositions[pos.substr(2, 2)];

  _leftFlag.position.x = _leftFlagOrigin.x + (leftPos.X * _maxFlagDistance);
  _leftFlag.position.y = _leftFlagOrigin.y + (leftPos.Y * _maxFlagDistance);
  _rightFlag.position.x = _rightFlagOrigin.x + (rightPos.X * _maxFlagDistance);
  _rightFlag.position.y = _rightFlagOrigin.y + (rightPos.Y * _maxFlagDistance);
}

function onLeftTrigger(button, value) {
  _leftFlag.angle = -value * 180;
}

function onRightTrigger(buttonCode, value) {
  _rightFlag.angle = value * 180;
}

function flagToAlpha(lx, ly, rx, ry) {
  let responseLeft = '';
  let responseRight = '';

  for (const lkey in _lpositions) {
    const { X, Y } = _lpositions[lkey];
    if (X - _fudge > lx < X + _fudge && Y - _fudge > ly < Y + _fudge) {
      console.log(lkey);
      responseLeft = lkey;
      break;
    }
  }

  for (const rkey in _rpositions) {
    const { X, Y } = _rpositions[rkey];
    if (X - _fudge > rx < X + _fudge && Y - _fudge > ry < Y + _fudge) {
      responseRight = rkey;
      break;
    }
  }

  let char;
  if (_numeralMode) {
    char = _numerals[`${responseLeft} + ${responseRight}`] || '';
  } else {
    char = _alphabet[`${responseLeft} + ${responseRight}`] || '';
    //if (char === '#') _numeralMode = !_numeralMode;
  }

  return ;
}

function alphaToFlag(char) {
  let inverted = _.invert(_alphabet);

  if (_numeralMode) inverted = _.invert(_numerals);
  
  return inverted[char.toUpperCase()] || '';
}

function handleInput() {
  _leftStickX = _pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X || 0);
  _leftStickY = _pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y || 0);

  _rightStickX = _pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) || 0;
  _rightStickY = _pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) || 0;

  _rightTrigger = _pad.axis(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER) || 0;
  _leftTrigger = _pad.axis(Phaser.Gamepad.XBOX360_LEFT_TRIGGER) || 0;
}

function moveFlags() {
  if (Math.abs(_rightStickX) > 0) {
    _rightFlag.x = _rightFlagOrigin.x + (_rightStickX * _maxFlagDistance);
  } else {
    _rightFlag.x = _rightFlagOrigin.x;
  }

  if (Math.abs(_rightStickY) > 0) {
    _rightFlag.y = _rightFlagOrigin.y + (_rightStickY * _maxFlagDistance);
  } else {
    _rightFlag.y = _rightFlagOrigin.y;
  }

  if (Math.abs(_leftStickX) > 0) {
    _leftFlag.x = _leftFlagOrigin.x + (_leftStickX * _maxFlagDistance);
  } else {
    _leftFlag.x = _leftFlagOrigin.x;
  }

  if (Math.abs(_leftStickY) > 0) {
    _leftFlag.y = _leftFlagOrigin.y + (_leftStickY * _maxFlagDistance);
  } else {
    _leftFlag.y = _leftFlagOrigin.y;
  }
}

function updateTxt() {
  if (_leftStickX === 0 && _leftStickY === 0 && _rightStickX === 0 && _rightStickY === 0) {
    _myChar = flagToAlpha(_leftStickX, _leftStickY, _rightStickX, _rightStickY);
    if (_myTxt) _myTxt.text = _myChar;
  }
}

function update() {
  if (_pad.connected) {
    handleInput();
    updateTxt();
    //moveFlags();
  }
}