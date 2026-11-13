import type { Phase } from '@/core/timeOfDay';

export type GardenPalette = {
  skyTop: string;
  skyBottom: string;
  sun: string;
  sunGlow: number;
  farHill: string;
  haze: string;
  hedge: string;
  hedgeShade: string;
  ground: string;
  groundShade: string;
  path: string;
  stone: string;
  stoneShade: string;
  engraving: string;
  leaf: string;
  leafLight: string;
  leafShade: string;
  leafVein: string;
  twig: string;
  wood: string;
  dapple: string;
  dappleOpacity: number;
  candleGlow: number;
  fireflyMin: number;
  fireflyMax: number;
  fireflyGlow: number;
  firefly: string;
  fireflyHalo: string;
  shadow: string;
  candleLight: string;
  wick: string;
  clay: string;
  clayShade: string;
  wax: string;
  waxShade: string;
};

const shared = {
  clay: '#c46b42',
  clayShade: '#8e4429',
  wax: '#f4e6cd',
  waxShade: '#d8c2a0',
  firefly: '#fff1bf',
  fireflyHalo: '#ffe08a',
  shadow: '#2f2e2b',
  candleLight: '#ffd88a',
  wick: '#3d2a1c',
};

export const ORCHARD: Record<Phase, GardenPalette> = {
  morning: {
    ...shared,
    skyTop: '#e9d3b8',
    skyBottom: '#f6ead5',
    sun: '#fff0cf',
    sunGlow: 0.45,
    farHill: '#c4b48e',
    haze: '#f3e6cf',
    hedge: '#8f9258',
    hedgeShade: '#767a48',
    ground: '#b9a56a',
    groundShade: '#9c8a55',
    path: '#ead2a6',
    stone: '#dfd2bc',
    stoneShade: '#b6a58a',
    engraving: '#5e4e3e',
    leaf: '#a8703a',
    leafLight: '#d39a4c',
    leafShade: '#7d4f2a',
    leafVein: '#f0d3a0',
    twig: '#5e3f27',
    wood: '#745038',
    dapple: '#fff0cc',
    dappleOpacity: 0.2,
    candleGlow: 0.15,
    fireflyMin: 0,
    fireflyMax: 0,
    fireflyGlow: 0,
  },
  day: {
    ...shared,
    skyTop: '#e2cfa6',
    skyBottom: '#f5ecd6',
    sun: '#fff6dc',
    sunGlow: 0.35,
    farHill: '#bfb58a',
    haze: '#f3ebd6',
    hedge: '#919858',
    hedgeShade: '#777e47',
    ground: '#bba96a',
    groundShade: '#9e8d56',
    path: '#eed7aa',
    stone: '#e2d6c1',
    stoneShade: '#b9a98e',
    engraving: '#5e4e3e',
    leaf: '#ad763d',
    leafLight: '#d9a352',
    leafShade: '#82532c',
    leafVein: '#f3d9a8',
    twig: '#5e3f27',
    wood: '#745038',
    dapple: '#fff4d6',
    dappleOpacity: 0.24,
    candleGlow: 0.1,
    fireflyMin: 0,
    fireflyMax: 0,
    fireflyGlow: 0,
  },
  golden: {
    ...shared,
    skyTop: '#eebd86',
    skyBottom: '#f7e1bd',
    sun: '#ffd88f',
    sunGlow: 0.65,
    farHill: '#c9a878',
    haze: '#f5dcb4',
    hedge: '#8a8a4e',
    hedgeShade: '#6f7140',
    ground: '#b49a5c',
    groundShade: '#957e48',
    path: '#e8c999',
    stone: '#dcccb2',
    stoneShade: '#b29e80',
    engraving: '#5e4e3e',
    leaf: '#a7652f',
    leafLight: '#d18f3f',
    leafShade: '#7a4524',
    leafVein: '#f2c98a',
    twig: '#58391f',
    wood: '#6e4a32',
    dapple: '#ffd690',
    dappleOpacity: 0.28,
    candleGlow: 0.35,
    fireflyMin: 0,
    fireflyMax: 0,
    fireflyGlow: 0,
  },
  evening: {
    ...shared,
    clay: '#8a4e34',
    clayShade: '#5e2f1f',
    wax: '#d9cbb3',
    waxShade: '#a8977c',
    skyTop: '#3b3550',
    skyBottom: '#8a6f78',
    sun: '#f1d6a8',
    sunGlow: 0.15,
    farHill: '#5a4c5a',
    haze: '#7c6670',
    hedge: '#4a4a3a',
    hedgeShade: '#3a3a2e',
    ground: '#5a5440',
    groundShade: '#4a4535',
    path: '#8a7d6c',
    stone: '#9d9389',
    stoneShade: '#7e756c',
    engraving: '#3a322b',
    leaf: '#6a4430',
    leafLight: '#8a5a38',
    leafShade: '#4c3022',
    leafVein: '#a3765a',
    twig: '#3a281d',
    wood: '#4f3627',
    dapple: '#ffcf80',
    dappleOpacity: 0.12,
    candleGlow: 1,
    fireflyMin: 5,
    fireflyMax: 8,
    fireflyGlow: 0.6,
  },
  night: {
    ...shared,
    clay: '#5e3626',
    clayShade: '#3c2018',
    wax: '#b9ad99',
    waxShade: '#857a69',
    skyTop: '#161a2e',
    skyBottom: '#3a3a52',
    sun: '#e9e4cf',
    sunGlow: 0.12,
    farHill: '#2e2e3e',
    haze: '#3a3a4e',
    hedge: '#2a2e28',
    hedgeShade: '#202420',
    ground: '#34362c',
    groundShade: '#282a22',
    path: '#5a5650',
    stone: '#77737a',
    stoneShade: '#58555c',
    engraving: '#26232a',
    leaf: '#3e2c24',
    leafLight: '#56402f',
    leafShade: '#2a1e19',
    leafVein: '#7a6352',
    twig: '#241a15',
    wood: '#33261e',
    dapple: '#ffcf80',
    dappleOpacity: 0.06,
    candleGlow: 1,
    fireflyMin: 12,
    fireflyMax: 16,
    fireflyGlow: 1,
  },
};
