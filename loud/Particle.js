class Particle {
  constructor(position, speed, color, size) {
    this.position = position.copy();
    this.speed = createVector(random(-speed, speed), random(-speed, speed));
    this.color = color;
    this.lifespan = 255.0;
    this.size = size;
  }

  get isDead() {
    return this.lifespan < 0 ? true : false;
  }

  get getDirectionSigns() {
    return [math.sign(this.direction.x), math.sign(this.direction.x)];
  }

  update() {
    this.prep();
    this.draw();
  }

  prep() {
    this.position.add(this.speed);
    this.lifespan -= 3;

    if (this.speed.x > 0) {
      this.speed.x += -0.05;
    } else if (this.speed.x < 0) {
      this.speed.x += 0.05;
    }

    if (this.speed.y > 0) {
      this.speed.y += -0.05;
    } else if (this.speed.y < 0) {
      this.speed.y += 0.05;
    }

    if (this.size > 0) {
      this.size -= 1;
    }
  }

  draw() {
    noStroke();
    this.color.setAlpha(this.lifespan);
    fill(this.color);
    //rect(this.position.x, this.position.y, 12, 12);
    ellipse(this.position.x, this.position.y, this.size, this.size);
  }
}