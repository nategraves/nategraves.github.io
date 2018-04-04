const previewSize = 30;

class Pad {
  constructor(width, height, row, col, note, color) {
    console.log("Pad");
    this.width = width;
    this.height = height;
    this.row = row;
    this.col = col;
    this.note = note;
    this.color = color;
    this.particles = [];

    /* Maybe i need the speed for the particles
    const noteIndex = Math.round(mouseX / padWidth);
    let note = noteStems[noteIndex];
    octave = Math.round(mouseY / padHeight) + 1;
    noteFinal = note + octave;
    speed = (2 + octave) / 2;
    */

  }

  update(drawing, mousePosition) {
    this.prep();
    this.draw(drawing, mousePosition);
  }

  prep(canvas) {

  }

  draw(drawing, mousePosition) {
    noStroke();
    fill( this.color );
    rect(row * this.width, col * this.height, this.width, this.height);
     /*
    for (let octave = minOctave; octave <= maxOctave; octave++) {
      const base = (octave - 1) * noteStems.length;

      for (let i = 0; i < noteStems.length; i++) {
        const noteStem = noteStems[i];
        noStroke();
        fill( colors[base + i] );
        const pad = rect(i * padWidth, (octave - 1) * padHeight, padWidth, padHeight);
      }
    }

    if (this.particles.length > 0) {
      this.particles.forEach((particle) => particle.update());
    }

    if (drawing) {
      const particle = new Particle(mousePosition, speed, this.currentColor);
      particles.push(particle);

      if (prevNoteFinal === null) {
        synth.triggerAttack(noteFinal);
      } else if (prevNoteFinal !== noteFinal) {
        synth.setNote(noteFinal);
        prevNoteFinal = noteFinal;
      }
    } else {
      synth.triggerRelease();
      prevNoteFinal = null;
    }

    //if mouse in pad  noStroke();
    fill(this.currentColor);
    ellipse(mousePosition.x, mousePosition.y, previewSize, previewSize);
    */
  }
}