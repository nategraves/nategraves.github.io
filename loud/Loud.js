const noteStems = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const freqs = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87];
const maxOctave = 7;
const minOctave = 1;
const totalOctaves = maxOctave - minOctave;
const totalNotes = totalOctaves * noteStems.length;
const colors = [];
const notes = [];
const particles = [];

let synth;
let noteFinal, prevNoteFinal;
let octave;
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
  synth.volumne = -10;

  canvas = document.getElementsByTagName('body')[0];
  canvasRect = canvas.getBoundingClientRect();
  width = canvasRect.width;
  height = canvasRect.height;
  padWidth = width / noteStems.length;
  padHeight = height / totalOctaves;
  createCanvas(width, height);

  for (let octave = 1; octave <= maxOctave; octave++) {
    for (let i = 0; i < noteStems.length; i++) {
      notes.push(noteStems[i] + octave);
      colors.push(this.randomColor());
    }
  }

  notes.sort();
}

function mousePressed() {
  drawing = true;
}

function mouseReleased() {
  drawing = false;
}

function drawPads() {
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    const base = (octave - 1) * noteStems.length;

    for (let i = 0; i < noteStems.length; i++) {
      const noteStem = noteStems[i];
      const color = colors[base + i];
      color.setAlpha(256);
      noStroke();
      fill(color);
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
  background(255);
  smooth();
  mousePosition = createVector(mouseX, mouseY);
  canvas = document.getElementsByTagName('body')[0];
  canvasRect = canvas.getBoundingClientRect();
  width = canvasRect.width;
  height = canvasRect.height;

  this.drawPads();
  this.drawParticles();

  const noteIndex = Math.round(mouseX / padWidth);
  note = noteStems[noteIndex];
  octave = Math.round(mouseY / padHeight) + 1;
  const noteFinal = note + octave;
  const speed = (2 + octave) / 2;

  this.currentColor = colors[ notes.indexOf(noteFinal) ];
  noStroke();
  this.currentColor.setAlpha(256);
  fill(this.currentColor);
  const previewSize = 30;
  //rect(mousePosition.x - (previewSize / 2), mousePosition.y - (previewSize / 2), previewSize, previewSize);
  ellipse(mousePosition.x, mousePosition.y, previewSize, previewSize);

  if (drawing) {
    const particle = new Particle(mousePosition, speed, this.currentColor);
    particles.push(particle);

    if (prevNoteFinal === 0) {
      synth.triggerAttack(noteFinal);
    } else if (prevNoteFinal !== noteFinal) {
      synth.setNote(noteFinal);
      prevNoteFinal = note;
    }
  } else {
    synth.triggerRelease();
    prevNoteFinal = 0;
  }
}
