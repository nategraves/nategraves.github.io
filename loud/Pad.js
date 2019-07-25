const previewSize = 30;

class Pad {
  constructor(padManager, width, height, row, col, note, color, synth) {
    this.padManager = padManager;
    this.width = width;
    this.height = height;
    this.row = row;
    this.col = col;
    this.note = note;
    this.color = color;
    this.particles = [];
    this.synth = synth;
    this.speed = 1.25;
    this.x = this.row * this.width;
    this.y = this.col * this.height;
    this.w  = this.width;
    this.h = this.height;
  }

  toString() {
    return [
      `Width: ${this.width},\n`
      `Height: ${this.height},\n`
      `Row: ${this.row},\n`
      `Note: ${this.note},\n`
      `Color: ${this.color}`
    ].join('');
  }

  update(drawing, mousePosition) {
    this.prep(drawing, mousePosition);
    this.draw(drawing, mousePosition);
  }

  prep(drawing, mousePosition) {
    this.x = this.row * this.width;
    this.y = this.col * this.height;
    this.w  = this.width;
    this.h = this.height;

    // Draw Pad Background
    strokeWeight(5);
    stroke(245);
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  }

  draw(drawing, mousePosition) {
    if (
      mousePosition.x > this.x && mousePosition.x < this.x + this.w &&
      mousePosition.y > this.y && mousePosition.x < this.x + this.w
    ) {
      // Reset color 
      // const _color = this.color;
      // _color.setAlpha(255);
      const x = mousePosition.x;
      const y = mousePosition.y;
      const colorX = Math.floor( (x / this.padManager.canvasRect.width) * 255);
      const colorY = Math.floor( (y / this.padManager.canvasRect.height) * 255);
      const oldZ = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      const colorZ = x * y / oldZ;
      console.log(`${colorX}, ${colorY}, ${colorZ}`);
      const _color = color(colorX, colorY, colorZ);

      // Draw Mouse Cursor
      const size = this.padManager.cursorSize;
      noStroke();
      fill(_color);
      ellipse(mousePosition.x, mousePosition.y, size, size);

      if (drawing) {
        // Start playing the note
        //this.synth.setNote(this.note);
        this.padManager.currentNote = this.note;

        this.particles.push(
          new Particle(mousePosition, this.speed, _color, size)
        );
      } else {
        //this.synth.triggerRelease();
        this.padManager.currentNote = null;
      }
    }

    if (this.particles.length > 0) {
      this.particles.forEach((particle) => particle.update());
    }
  }
}