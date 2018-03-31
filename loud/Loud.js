const noteStems = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const freqs = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87];
const maxOctave = 7;
const minOctave = 1;
const previewSize = 30;
const totalOctaves = maxOctave - minOctave;
const totalNotes = totalOctaves * noteStems.length;
const colors = [];
const notes = [];
const particles = [];

let synth;
let noteFinal, prevNoteFinal;
let octave;
let speed;
let emitter, blocks;
let drawing = false;
let currentColor;
let mousePosition;
let prevPos;
let width, height;
let canvas, canvasRect;
let padWidth, padHeight;

function randomColor() {
  const r = Math.round(Math.random() * 255);
  const g = Math.round(Math.random() * 255);
  const b = Math.round(Math.random() * 255);
  return color(r, b, g);
}

function setup() {
  synth = new Tone.AMSynth().toMaster();
  synth.volumne = -30;

  this.prepFrame();

  for (let octave = 1; octave <= maxOctave; octave++) {
    for (let i = 0; i < noteStems.length; i++) {
      notes.push( noteStems[i] + octave );
      colors.push( this.randomColor() );
    }
  }

  createCanvas(width, height);
}

function mousePressed() {
  drawing = true;
}

function mouseReleased() {
  drawing = false;
}

function prepFrame() {
  background(255);
  smooth();

  mousePosition = createVector(mouseX, mouseY);
  canvas = document.getElementsByTagName('body')[0];
  canvasRect = canvas.getBoundingClientRect();
  width = canvasRect.width;
  height = canvasRect.height;
  padWidth = width / noteStems.length;
  padHeight = height / totalOctaves;

  const noteIndex = Math.round(mouseX / padWidth);
  let note = noteStems[noteIndex];
  octave = Math.round(mouseY / padHeight) + 1;
  noteFinal = note + octave;
  speed = (2 + octave) / 2;
}

function drawPads() {
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    const base = (octave - 1) * noteStems.length;

    for (let i = 0; i < noteStems.length; i++) {
      const noteStem = noteStems[i];
      noStroke();
      fill( colors[base + i] );
      const pad = rect(i * padWidth, (octave - 1) * padHeight, padWidth, padHeight);
    }
  }
}

function drawParticles() {
  if (particles.length > 0) {
    particles.forEach((particle) => particle.update());
  }
}

function draw() {
  this.prepFrame();

  this.currentColor = colors[ notes.indexOf(noteFinal) ];
  if (this.currentColor == null) {
    debugger;
  }

  this.drawPads();
  this.drawParticles();

  noStroke();
  //this.currentColor.setAlpha(256);
  fill(this.currentColor);
  //rect(mousePosition.x - (previewSize / 2), mousePosition.y - (previewSize / 2), previewSize, previewSize);
  ellipse(mousePosition.x, mousePosition.y, previewSize, previewSize);

  if (drawing) {
    const particle = new Particle(mousePosition, speed, this.currentColor);
    particles.push(particle);

    if (prevNoteFinal === null) {
      synth.triggerAttack(noteFinal);
    } else if (prevNoteFinal !== noteFinal) {
      synth.setNote(noteFinal);
      prevNoteFinal = noteFinal;
    }
  } else {
    synth.triggerRelease();
    prevNoteFinal = null;
  }
}
