var flock;

function setup() {
  createCanvas(windowWidth, 500);

  flock = new Flock();
  for (var i = 0; i < 200; i++) {
    var d = new Dot(random(width), random(height));
    flock.addDot(d);
  }
}

function draw() {
  flock.run(createVector(mouseX, mouseY));
}

function Flock() {
  background(255);
  this.dots = [];
}

Flock.prototype.run = function(target) {
  for (var i = 0; i < this.dots.length; i++) {
    this.dots[i].run(this.dots, target);
  }
}

Flock.prototype.addDot = function(d) {
  this.dots.push(d);
}

function Dot(x, y) {
  this.acceleration = createVector(0,0);
  this.velocity = createVector(random(-1,1),random(-1,1));
  this.position = createVector(x,y);
  this.r = random(2, 10);
  this.maxspeed = 3;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
  this.lifetime = 240;
}

Dot.prototype.run = function(dots, target) {
  this.flock(dots, target);
  this.update();
  this.borders();
  this.render();
}

Dot.prototype.applyForce = function(force) {
  this.acceleration.add(force / this.r);
}

Dot.prototype.flock = function(dots, target) {
  var sep = this.separate(dots);   // Separation
  var ali = this.align(dots);      // Alignment
  var coh = this.cohesion(dots, target);   // Cohesion

  // Arbitrarily weight these forces
  sep.mult(1.0);
  ali.mult(0.1);
  coh.mult(1.5);

  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

Dot.prototype.update = function() {
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);

  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
  this.lifespan -= 2;
}

Dot.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target, this.position);
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  var steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Dot.prototype.render = function() {
  var theta = this.velocity.heading() + radians(90);
  stroke(235, 255, 0, this.lifetime);
  fill(235, 255, 0, this.lifetime);
  //push();
  //rotate(theta);
  ellipse(this.position.x, this.position.y, this.r, this.r);
  //pop();
}

// Wraparound
Dot.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = width +this.r;
  if (this.position.y < -this.r)  this.position.y = height+this.r;
  if (this.position.x > width +this.r) this.position.x = -this.r;
  if (this.position.y > height+this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby dots and steers away
Dot.prototype.separate = function(dots) {
  var desiredseparation = 10.0;
  var steer = createVector(0,0);
  var count = 0;
  // For every dot in the system, check if it's too close
  for (var i = 0; i < dots.length; i++) {
    var d = p5.Vector.dist(this.position,dots[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      var diff = p5.Vector.sub(this.position,dots[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby dot in the system, calculate the average velocity
Dot.prototype.align = function(dots) {
  var neighbordist = 50;
  var sum = createVector(0,0);
  var count = 0;
  for (var i = 0; i < dots.length; i++) {
    var d = p5.Vector.dist(this.position,dots[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(dots[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    var steer = p5.Vector.sub(sum,this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0,0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby dots, calculate steering vector towards that location
Dot.prototype.cohesion = function(dots, target) {
  var neighbordist = 50;
  var sum = createVector(0,0);   // Start with empty vector to accumulate all locations
  var count = 0;
  for (var i = 0; i < dots.length; i++) {
    var d = p5.Vector.dist(this.position,dots[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(dots[i].position); // Add location
      count++;
    }
  }
  if (count > 0 && target) {
    return this.seek(target);  // Steer towards the location
  } else if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0,0);
  }
}