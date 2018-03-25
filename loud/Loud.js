const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const freqs = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87];
const minOctave = 1;
const maxOctave = 7;
const minFreq = 400;
const maxFreq = 10000;
const blockCount = 13;
const totalNotes = (maxFreq - minFreq) * notes.length;

let freq, prevFreq;
let vel, prevVel;
let emitter, blocks;

window.onload = () => {
  const synth = new Tone.Synth().toMaster();

  const canvas = document.getElementById('magic');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const app = new PIXI.Application();
  canvas.appendChild(app.view);

  function onPointerDown(event) {
    console.log(event);
  }

  const texture = PIXI.Texture.fromImage('Tone.png');
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  for (let i = 0; i < totalNotes; i++) {
    const block = new PIXI.Sprite(texture);
    block.interactive = true;
    block.buttonMode = true;
    block.anchor.set(0.5);
    block.width = width / notes.length;
    block.height = height / (maxOctave - minOctave);
    block.on('pointerdown', onPointerDown);
    app.stage.addChild(block);
  }

  emitter = new PIXI.particles.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  });

  console.log('renderer created');
  console.log(app);
  app.renderer.plugins.interaction.onPointerDown = (e) => {
    console.log(`Pointer down: ${e}`);
  }

  /*
  renderer = new PIXI.autoDetectRenderer();
  renderer.plugins.interaction.on('mousedown', (e) => {
    console.log('mousedown');
  })
  */

  /* OnClick and OnMove
  //set emitter positon to mouse click position
  app.stage.addChild(emitter);
  blocks = [];
  const blockColor = Math.random() * 0xE8;
  for (let i = 0; i < blockCount; i++) {
    const block = PIXI.Sprite.fromImage('block.png');

    block.tint = `0x${ Math.floor( Math.random() * 16777215 ).toString(16) }`;
    block.anchor.set(0.5);
    block.scale.set(0.8 + Math.random() * 0.2);
    block.x = emitter.x;
    block.y = emitter.y;
    block.direction = Math.random() * Math.PI * 2;
    block.turningSpeed = Math.random() - 0.5;
    block.speed = (2 + Math.random() * 2);
    block.offset = Math.random() * 100;
    blocks.push(block);
    emitter.addChild(block);
  }

  OLD MOUSE DOWN*****************
    console.log("Mouse Down");
    freq = null;
    prevFreq = null;
    vel = null;

    const mouseX = pointer.x;
    console.log(`MouseX: ${mouseX}`);
    const width = canvas.clientWidth;
    console.log(`Width: ${width}`);

    //freq = freqs[Math.round((mouseX / width) * notes.length)].toString();
    freq = notes[Math.round((mouseX / width) * notes.length)];
    console.log(`MouseDown Freq: ${freq}`);
    vel = Math.round((pointer.y / canvas.clientHeight) * (maxOctave - minOctave)).toString();
    console.log(`MouseDown Vel: ${vel}`);
    
    freq += vel;
    console.log(`MouseDown Combo: ${freq}`);

    if (freq === prevFreq) {
      prevFreq = freq;
    }

    //synth.freq = freq;
    //synth.start();
    synth.triggerAttack(freq);
    emitter.x = pointer.x;
    emitter.y = pointer.y;
    emitter.start(true, 2000, null, 10);

  
  */


  // Update function
  const blocks = [];
  const tick = 0;
  app.ticker.add(() => {
    for(let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      block.direction += dude.turningSpeed *  0.05;
      block.x += Math.sin(block.direction) * (block.speed * block.scale.y);
      block.y += Math.cos(block.direction) * (block.speed * block.scale.y);
      block.rotation = -block.direction + Math.PI;
    }
  })

  /*
  tool.onMouseDrag = (event) => {
    var step = event.delta * 1.05;
    step.angle += 75;

    var top = event.middlePoint - step;
    var bottom = event.middlePoint + step;

    path.add(top);
    path.insert(0, bottom);
    path.smooth();

    const mouseX = event.point.x;
    console.log(`MouseX: ${mouseX}`);
    const width = canvas.clientWidth;
    console.log(`Width: ${width}`);

    const size = new Size(10,10);
    const shape = new Rectangle(event.point, size);
    shape.fill = '#000000';
    shape.fill = {
      hue: Math.random * 360,
      saturation: 1,
      brightness: 1
    };

    //freq = freqs[Math.round((mouseX / width) * notes.length)].toString();
    freq = notes[Math.round((mouseX / width) * notes.length)];
    console.log(`MouseDrag Freq: ${freq}`);
    vel = Math.round((event.point.y / canvas.clientHeight) * (maxOctave - minOctave)).toString();
    console.log(`MouseDrag Vel: ${vel}`);
    
    //freq *= vel;
    freq += vel;
    console.log(`MouseDrag Combo: ${freq}`);

    if (freq === prevFreq) {
      prevFreq = freq;
    }

    //synth.freq = freq;
    //synth.volume = vel;
    synth.triggerAttack(freq);
  }

  tool.onMouseUp = (event) => {
    path.add(event.point);
    path.closed = true;
    path.smooth();
    synth.stop();
    synth.triggerRelease();
  }
  */

};