const noteStems = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const maxOctave = 7;
const minOctave = 1;
const totalOctaves = maxOctave - minOctave;
const totalNotes = totalOctaves * noteStems.length;
const notes = [];

let padManager;
let synth;
let octave;
let drawing = false;
let mousePosition;

function setup() {
  synth = new Tone.AMSynth().toMaster();
  synth.volumne = -30;

  this.prep();

  createCanvas(width, height);
  padManager = new PadManager(canvasRect, noteStems, minOctave, maxOctave, synth);
}

function mousePressed() {
  drawing = true;
}

function mouseReleased() {
  drawing = false;
}

function prep() {
  background(255);
  smooth();

  mousePosition = createVector(mouseX, mouseY);
  canvas = document.getElementsByTagName('body')[0];
  canvasRect = canvas.getBoundingClientRect();
}

function draw() {
  this.prep();
  padManager.update(drawing, mousePosition);
}
