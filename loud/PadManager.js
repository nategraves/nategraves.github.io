class PadManager {
  static randomColor() {
    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);
    return color(r, b, g);
  }

  constructor(canvasRect, noteStems, minOctave, maxOctave, synth) {
    this.canvasRect = canvasRect;
    this.noteStems = noteStems;
    this.minOctave = minOctave;
    this.maxOctave = maxOctave;
    this.padWidth = this.canvasRect.width / noteStems.length;
    this.padHeight = this.canvasRect.height / (maxOctave - minOctave);
    this.synth = synth;
    this.pads = [];
    this.cursorSize = Math.round((this.padWidth / 4) / 10) * 10;
    this.currentNote = null;

    for (let row = minOctave; row <= maxOctave; row++) {
      for (let col = 0; col < noteStems.length; col++) {
        const note = noteStems[row - 1] + (col);
        const color = PadManager.randomColor();
        this.pads.push(
          new Pad(
            this,
            this.padWidth,
            this.padHeight,
            row - 1,
            col,
            note,
            color,
            synth
          )
        );
      }
    }
  } 

  update(canvasRect, drawing, mousePosition) {
    clear();
    if (this.pads.length > 0) {
      this.pads.forEach((pad) => {
        pad.update(drawing, mousePosition);
      });
    }
  }
}