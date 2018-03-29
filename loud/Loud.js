const noteStems = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
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

function randomColor() {
  const r = Math.round(Math.random() * 255);
  const g = Math.round(Math.random() * 255);
  const b = Math.round(Math.random() * 255);
  return color(r, b, g);
}

function setup() {
  synth = new Tone.AMSynth().toMaster();
  synth.volumne = -10;
  const width = window.innerWidth;
  const height = window.innerHeight;
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

function draw() {
  background(255);
  smooth();
  mousePosition = createVector(mouseX, mouseY);

  if (particles.length > 0) {
    particles.forEach((particle) => particle.update());
  }

  const noteIndex = Math.round((mouseX / width) * (noteStems.length - 1));
  note = noteStems[noteIndex];
  octave = Math.round((mouseY / height) * (maxOctave - minOctave)) + 1;
  const noteFinal = note + octave;
  const speed = (2 + octave) / 2;
  console.log(noteFinal);

  this.currentColor = colors[ notes.indexOf(noteFinal) ];
  noStroke();
  this.currentColor.setAlpha(256);
  fill(this.currentColor);
  const previewSize = 30;
  //rect(mousePosition.x - (previewSize / 2), mousePosition.y - (previewSize / 2), previewSize, previewSize);
  ellipse(mousePosition.x - (previewSize / 2), mousePosition.y - (previewSize / 2), previewSize, previewSize);

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
