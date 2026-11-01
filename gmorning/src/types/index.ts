export interface GameObject {
  id: string | number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  dieOnCollision?: boolean;
  alive?: boolean;
  dob?: number;
  color?: string;
  score?: number;
  cellId?: string;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  mouseX: number;
  mouseY: number;
  mouseRightDown: boolean;
  mouseLeftDown: boolean;
  space: boolean;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  p: boolean;
  r: boolean;
  q: boolean;
}

export interface Vector {
  x: number;
  y: number;
}
