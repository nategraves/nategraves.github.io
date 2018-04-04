class PadManager {
  static randomColor() {
    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);
    return color(r, b, g);
  }

  constructor(canvasRect, noteStems, minOctave, maxOctave, synth) {
    console.log('PadManager');
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    this.padWidth = canvasWidth / noteStems.length;
    this.padHeight = canvasHeight / (maxOctave - minOctave);
    this.pads = [];
    this.synth = synth;

    for (let row = minOctave; row <= maxOctave; row++) {
      for (let col = 0; col < noteStems.length; col++) {
        const note = noteStems[col] + row;
        this.pads.push = new Pad(
          this.padWidth,
          this.padHeight,
          row,
          col,
          note,
          PadManager.randomColor(),
          synth
        );
      }
    }
  } 

  update(drawing, mousePosition) {
    this.prep();
    this.draw(drawing, mousePosition);
  }

  prep() {
  }

  draw(drawing, mousePosition) {
    if (this.pads.length > 0) {
      this.pads.forEach((pad) => pad.update(drawing, mousePosition));
    }
  }
}