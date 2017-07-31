var fog = null;

function setup() {
  var canvas = createCanvas(windowWidth, 500);
  canvas.parent('interactive');
  fog = new Fog();
}

function draw() {
  fog.update();
}

function Fog()  {
  this.dots = [];
}

Fog.prototype.add = function(x, y) {
  this.dots.push(new Dot(x, y));
  console.log(this.dots.length);
}

Fog.prototype.update = function() {
  clear();
  this.add(mouseX, mouseY);
  console.log(this.dots.length);

  for (var i = 0; i < this.dots.length; i++) {
    if (this.dots[i].lifespan > 0) {
      this.dots[i].update();
      this.dots[i].display();
    } else {
      this.dots.splice(i, 1);
    }
  }
}

function Dot(x, y) {
  this.position = createVector(x, y);
  this.lifespan = 240.0;
}

Dot.prototype.update = function() {
  this.lifespan -= 6.0;
  //console.log(this.lifespan);
}

Dot.prototype.display = function() {
  if (this.lifespan >  2) {
    stroke(240, this.lifespan);
    fill(240, this.lifespan);
    ellipse(this.position.x, this.position.y, 150, 150);
  }
}
