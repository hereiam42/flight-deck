// Geographic node positions for the SVG map canvas.
// Coordinates are in the 960x540 viewBox space.
// Japan hub center-right, EU center-left, AU bottom-right, NZ far bottom-right, CA far left.

export const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  jp: { x: 720, y: 195 },
  eu: { x: 390, y: 150 },
  au: { x: 690, y: 390 },
  nz: { x: 790, y: 430 },
  ca: { x: 150, y: 155 },
}

// SVG viewBox dimensions
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540
