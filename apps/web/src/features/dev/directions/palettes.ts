export type TimeOfDay = 'morning' | 'day' | 'golden' | 'evening';

export type ScenePalette = {
  skyTop: string;
  skyBottom: string;
  sun: string;
  sunGlow: number;
  farHill: string;
  haze: string;
  hedge: string;
  hedgeShade: string;
  wall: string;
  ground: string;
  groundShade: string;
  path: string;
  stone: string;
  stoneShade: string;
  engraving: string;
  moss: string;
  wood: string;
  leaf: string;
  leafLight: string;
  dapple: string;
  dappleOpacity: number;
  candleGlow: number;
  fireflies: boolean;
  cat: string;
  catShade: string;
  pot: string;
  flowerA: string;
  flowerB: string;
};

const base = {
  wall: '#bdb8ae',
  stone: '#cdc9c1',
  stoneShade: '#a8a49b',
  engraving: '#6f6b63',
  moss: '#7e9461',
  wood: '#7a5f47',
  cat: '#b48a64',
  catShade: '#94704f',
  pot: '#b5734f',
  flowerA: '#d9928e',
  flowerB: '#e8c46f',
};

export const PALETTES: Record<TimeOfDay, ScenePalette> = {
  morning: {
    ...base,
    skyTop: '#cfe0e6',
    skyBottom: '#f3ede0',
    sun: '#fff4d6',
    sunGlow: 0.45,
    farHill: '#b7c6bb',
    haze: '#eef2ee',
    hedge: '#8ea88a',
    hedgeShade: '#77927a',
    ground: '#a9bd8f',
    groundShade: '#93a87d',
    path: '#d9cfb9',
    leaf: '#7f9a72',
    leafLight: '#a3b98f',
    dapple: '#fff8e6',
    dappleOpacity: 0.18,
    candleGlow: 0.15,
    fireflies: false,
  },
  day: {
    ...base,
    skyTop: '#bcd8e2',
    skyBottom: '#eef1e6',
    sun: '#fffbe9',
    sunGlow: 0.35,
    farHill: '#a9bfa6',
    haze: '#eef3ea',
    hedge: '#86a37c',
    hedgeShade: '#6f8d68',
    ground: '#a2bc80',
    groundShade: '#8ba66d',
    path: '#e0d6bf',
    leaf: '#789a64',
    leafLight: '#9fbc82',
    dapple: '#fffbea',
    dappleOpacity: 0.22,
    candleGlow: 0.1,
    fireflies: false,
  },
  golden: {
    ...base,
    skyTop: '#f2cf9c',
    skyBottom: '#f6e7cc',
    sun: '#ffe2a3',
    sunGlow: 0.6,
    farHill: '#c3b38d',
    haze: '#f7e6c6',
    hedge: '#8f9c6b',
    hedgeShade: '#77845a',
    ground: '#b1ae78',
    groundShade: '#979462',
    path: '#e6cfa2',
    stone: '#d6cbb8',
    stoneShade: '#ae9f88',
    leaf: '#7f8c56',
    leafLight: '#b1a865',
    dapple: '#ffe3a6',
    dappleOpacity: 0.32,
    candleGlow: 0.35,
    fireflies: false,
  },
  evening: {
    ...base,
    skyTop: '#3f4a6e',
    skyBottom: '#8b88a8',
    sun: '#f0d9b5',
    sunGlow: 0.15,
    farHill: '#58607c',
    haze: '#7b7b98',
    hedge: '#465a55',
    hedgeShade: '#394a47',
    wall: '#7e7d86',
    ground: '#55664f',
    groundShade: '#475641',
    path: '#8e8a86',
    stone: '#9a98a0',
    stoneShade: '#7c7a84',
    engraving: '#4a4852',
    leaf: '#3f5249',
    leafLight: '#55695a',
    dapple: '#ffd38a',
    dappleOpacity: 0.12,
    candleGlow: 1,
    fireflies: true,
    cat: '#8a7563',
    catShade: '#6f5d4f',
    flowerA: '#b77b7c',
    flowerB: '#c9a85e',
  },
};

export const STATIONERY = {
  paper: '#fbf7ee',
  frame: '#d9cfbd',
  ink: '#6e6b65',
  inkSoft: '#a39d92',
  sage: '#8fa58a',
  rose: '#c98f8f',
  gold: '#c8a96a',
  stoneWash: '#e7e2d8',
  sky: '#f3e3c3',
};
