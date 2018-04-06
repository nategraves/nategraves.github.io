const noteStems = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const maxOctave = 7;
const minOctave = 1;
const totalOctaves = maxOctave - minOctave;
const totalNotes = totalOctaves * noteStems.length;
const notes = [];

let processingCanvas;
let padManager;
let synth;
let octave;
let drawing = false;
let mousePosition;
let counter = 0;

function setup() {
  synth = new Tone.MonoSynth().toMaster();
  synth.volume.value = -20;

  prep();

  processingCanvas = createCanvas(canvasRect.width, canvasRect.height);
  padManager = new PadManager(
    canvasRect,
    noteStems,
    minOctave,
    maxOctave,
    synth
  );
}

function touchPressed() {
  drawing = true;
}

function touchEnded() {
  drawing = false;
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
  counter++;
  prep();
  padManager.update(canvasRect, drawing, mousePosition);

  if (padManager.currentNote === null) {
    synth.triggerRelease();
  } else {
    //synth.setNote(padManager.currentNote);
    synth.triggerAttackRelease(padManager.currentNote, "8n");
  }

  if (counter % 100 === 0) {
    //debugger;
  }

  if (!focused) {
    synth.triggerRelease();
    drawing = false;
  }
}
