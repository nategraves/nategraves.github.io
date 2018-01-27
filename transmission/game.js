const _gameWidth = 1000;
const _gameHeight = 700;
const _axisMin = 0.05;
const _rightFlagOrigin = { x: 240, y: 570 };
const _leftFlagOrigin = { x: 130, y: 570 };
const _maxFlagDistance = 75;
let _pad, _friend, _leftFlag, _leftArm, _rightFlag, _rightArm, _flags;

const game = new Phaser.Game(
  _gameWidth,
  _gameHeight,
  Phaser.AUTO,
  '',
  { preload: preload, create: create, update: update }
)

function preload() {
  game.load.image('bg', 'bg.png');
  game.load.image('friend', 'friend.png');
  game.load.image('flagLeft', 'flagLeft.png');
  game.load.image('flagRight', 'flagRight.png');
  game.input.gamepad.start();
}

function create() {
  game.add.sprite(0, 0, 'bg');

  _friend = game.add.sprite(185, 500, 'friend');
  _friend.anchor.setTo(0.5, 0);

  _leftFlag = game.add.sprite(_leftFlagOrigin.x, _leftFlagOrigin.y, 'flagLeft');
  _leftFlag.anchor.setTo(0.5, 1);

  _rightFlag = game.add.sprite(_rightFlagOrigin.x, _rightFlagOrigin.y, 'flagRight');
  _rightFlag.anchor.setTo(0.5, 1);

  _flags = game.add.group();
  _flags.add(_leftFlag);
  _flags.add(_rightFlag);

  game.world.bringToTop(_friend);

  _pad = game.input.gamepad.pad1;
  _pad.onConnect = listenerSetup();

  game.input.gamepad.start();
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

function onLeftTrigger(button, value) {
  _leftFlag.angle = -value * 180;
}

function onRightTrigger(buttonCode, value) {
  _rightFlag.angle = value * 180;
}

function update() {
  if (_pad.connected) {
    const rightStickX = _pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X);
    const rightStickY = _pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y);
    const leftStickX = _pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X);
    const leftStickY = _pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y);
    const rightTrigger = _pad.axis(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER);
    const leftTrigger = _pad.axis(Phaser.Gamepad.XBOX360_LEFT_TRIGGER);

    if (Math.abs(rightStickX) > _axisMin) {
      _rightFlag.x = _rightFlagOrigin.x + (rightStickX * _maxFlagDistance);
    } else {
      _rightFlag.x = _rightFlagOrigin.x;
    }

    if (Math.abs(rightStickY) > _axisMin) {
      _rightFlag.y = _rightFlagOrigin.y + (rightStickY * _maxFlagDistance);
    } else {
      _rightFlag.y = _rightFlagOrigin.y;
    }

    if (Math.abs(leftStickX) > _axisMin) {
      _leftFlag.x = _leftFlagOrigin.x + (leftStickX * _maxFlagDistance);
    } else {
      _leftFlag.x = _leftFlagOrigin.x;
    }

    if (Math.abs(leftStickY) > _axisMin) {
      _leftFlag.y = _leftFlagOrigin.y + (leftStickY * _maxFlagDistance);
    } else {
      _leftFlag.y = _leftFlagOrigin.y;
    }
  }
}