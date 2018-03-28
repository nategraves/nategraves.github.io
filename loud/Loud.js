/*
var system;

function setup() {
  createCanvas(720, 400);
  system = new ParticleSystem(createVector(width/2, 50));
}

function draw() {
  background(51);
  system.addParticle();
  system.run();
}

// A simple Particle class
var Particle = function(position) {
  this.acceleration = createVector(0, 0.05);
  this.velocity = createVector(random(-1, 1), random(-1, 0));
  this.position = position.copy();
  this.lifespan = 255.0;
};

Particle.prototype.run = function() {
  this.update();
  this.display();
};

// Method to update position
Particle.prototype.update = function(){
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.lifespan -= 2;
};

// Method to display
Particle.prototype.display = function() {
  stroke(200, this.lifespan);
  strokeWeight(2);
  fill(127, this.lifespan);
  ellipse(this.position.x, this.position.y, 12, 12);
};

// Is the particle still useful?
Particle.prototype.isDead = function(){
  if (this.lifespan < 0) {
    return true;
  } else {
    return false;
  }
};

var ParticleSystem = function(position) {
  this.origin = position.copy();
  this.particles = [];
  this.totalCount = 0;
};

ParticleSystem.prototype.addParticle = function() {
  if (this.totalCount < 100) {
    this.particles.push(new Particle(this.origin));
    this.totalCount += 1;
  }
};

ParticleSystem.prototype.run = function() {
  for (var i = this.particles.length-1; i >= 0; i--) {
    var p = this.particles[i];
    p.run();
    if (p.isDead()) {
      this.particles.splice(i, 1);
    }
  }
};
*/

const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const freqs = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87];
const minOctave = 1;
const maxOctave = 7;
const minFreq = 400;
const maxFreq = 10000;
const blockCount = 13;
const totalNotes = (maxFreq - minFreq) * notes.length;
const particles = [];

let synth;
let freq, prevFreq;
let vel, prevVel;
let emitter, blocks;
let drawing = false;
let currentColor = null;
let prevPos;

function setup() {
  synth = new Tone.AMSynth().toMaster();
  synth.volumne = -10;
  const width = window.innerWidth;
  const height = window.innerHeight;
  createCanvas(width, height);
  //setAttributes('antialias', true);
}

function mousePressed() {
  drawing = true;
  currentColor = randomColor();
}

function mouseReleased() {
  drawing = false;
}

function draw() {
  background(200);

  if (particles.length > 0) {
    particles.forEach((particle) => particle.update());
  }

  if (drawing) {
    let position = createVector(mouseX, mouseY, 0);
    const particle = new Particle(position);
    particles.push(particle);
    freq = notes[Math.round((mouseX / width) * notes.length)];
    vel = Math.round((mouseY / height) * (maxOctave - minOctave));
    freq += vel;

    if (prevFreq === 0) {
      synth.triggerAttack(freq);
    } else if (prevFreq !== freq) {
      synth.setNote(freq);
    }

    prevFreq = freq;
  } else {
    synth.triggerRelease();
    prevFreq = 0;
  }
}

function randomColor() {
  const r = Math.round(Math.random() * 255);
  const g = Math.round(Math.random() * 255);
  const b = Math.round(Math.random() * 255);
  return [r, b, g];
}