export type View = { x: number; y: number; width: number; height: number };

export const GROUND_Y = 500;
export const SCENE_CENTER_X = 400;
export const SCENE_SPAN = { left: -1600, right: 2400 };

const MIN_WIDTH = 340;
const MIN_HEIGHT = 380;
const MIN_ASPECT = 0.4;
const MAX_ASPECT = 4;

export function fitView(aspect: number): View {
  const ratio = Number.isFinite(aspect) ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect)) : 1.6;
  const height = Math.max(MIN_HEIGHT, MIN_WIDTH / ratio);
  const width = height * ratio;
  return { x: SCENE_CENTER_X - width / 2, y: GROUND_Y - height, width, height };
}

export function viewBox(view: View): string {
  return [view.x, view.y, view.width, view.height].map((n) => n.toFixed(1)).join(' ');
}
