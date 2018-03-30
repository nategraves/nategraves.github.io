class Particle {
  constructor(position, speed, color) {
    this.position = position.copy();
    this.speed = createVector(random(-speed, speed), random(-speed, speed));
    this.color = color;
    this.lifespan = 255.0;
    //this.size = 12 + (octave - maxOctave)
  }

  get isDead() {
    return this.lifespan < 0 ? true : false;
  }

  get getDirectionSigns() {
    return [math.sign(this.direction.x), math.sign(this.direction.x)];
  }

  update() {
    this.move();
    this.display();
  }

  move() {
    this.position.add(this.speed);
    this.lifespan -= 5;

    if (this.speed.x > 0) {
      this.speed.x += -0.1;
    } else if (this.speed.x < 0) {
      this.speed.x += 0.1;
    }

    if (this.speed.y > 0) {
      this.speed.y += -0.1;
    } else if (this.speed.y < 0) {
      this.speed.y += 0.1;
    }
  }

  display() {
    noStroke();
    this.color.setAlpha(this.lifespan);
    fill(this.color);
    rect(this.position.x, this.position.y, 12, 12);
    //ellipse(this.position.x, this.position.y, 12, 12);
  }
}