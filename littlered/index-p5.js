function setup() {
  var canvas = createCanvas(windowWidth, 500);
  canvas.parent('interactive');
}

function draw() {
  fill(255);
  stroke(255);
  ellipse(mouseX, mouseY, 80, 80);
}