export const TEST_VIEWPORTS = [
  { name: 'small phone', width: 320, height: 640 },
  { name: 'phone', width: 360, height: 800 },
  { name: 'iPhone', width: 390, height: 844 },
  { name: 'landscape phone', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1080 },
] as const;

export const MIN_TOUCH_TARGET_PX = 44;
