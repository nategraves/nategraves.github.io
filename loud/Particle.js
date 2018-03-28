class Particle {
  constructor(position) {
    this.position = position.copy();
    this.direction = createVector(random(-5, 5), random(-5, 5));
    this.lifespan = 255.0;
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
    this.direction.add(this.acceleration);
    this.position.add(this.direction);
    this.lifespan -= 5;
  }

  display() {
    stroke(200, this.lifespan);
    strokeWeight(2);
    fill(127, this.lifespan);
    ellipse(this.position.x, this.position.y, 12, 12);
  }
}