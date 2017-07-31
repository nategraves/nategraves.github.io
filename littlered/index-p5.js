var fog = null;

function setup() {
  var canvas = createCanvas(windowWidth, 500);
  canvas.parent('interactive');
  fog = new Fog();
}

function mousePressed() {
  fog.addMovingDots(mouseX, mouseY);
}

function draw() {
  fog.update();
}

function Fog()  {
  this.dots = [];
  this.movingDots = [];
}

Fog.prototype.addDot = function(x, y) {
  this.dots.push(new Dot(x, y));
}

Fog.prototype.addMovingDots = function(x, y) {
  for (var i = 0; i < 100; i++) {
    this.movingDots.push(new MovingDot(createVector(mouseX, mouseY)));
  }
}

Fog.prototype.update = function() {
  clear();
  this.addDot(mouseX, mouseY);

  for (var i = 0; i < this.dots.length; i++) {
    if (this.dots[i].lifespan > 0) {
      this.dots[i].update();
      this.dots[i].display();
    } else {
      this.dots.splice(i, 1);
    }
  }

  for (var i = 0; i < this.movingDots.length; i++) {
    if (this.movingDots[i].lifespan > 0) {
      this.movingDots[i].update();
      this.movingDots[i].display();
    } else {
      this.movingDots.splice(i, 1);
    }
  }
}

function Dot(x, y) {
  this.position = createVector(x, y);
  this.lifespan = 240.0;
}

Dot.prototype.update = function() {
  this.lifespan -= 6.0;
}

Dot.prototype.display = function() {
  if (this.lifespan >  2) {
    stroke(235, 255, 0, this.lifespan);
    fill(235, 255, 0, this.lifespan);
    ellipse(this.position.x, this.position.y, 150, 150);
  }
}

function MovingDot(position) {
  this.velocity = createVector(random(-5, 5), random(-5, 5));
  this.position = position.copy();
  this.lifespan = 240.0;
  this.radius = random(20, 150);
}

MovingDot.prototype.run = function() {
  this.update();
  this.display();
}

MovingDot.prototype.update = function() {
  this.position.add(this.velocity);
  this.lifespan -= 2;
}

MovingDot.prototype.display = function() {
  if (this.lifespan >  2) {
    stroke(235, 255, 0, this.lifespan);
    fill(235, 255, 0, this.lifespan);
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
  }
}
