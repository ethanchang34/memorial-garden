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
  wall: string;
  ground: string;
  groundShade: string;
  path: string;
  stone: string;
  stoneShade: string;
  engraving: string;
  leaf: string;
  leafLight: string;
  wood: string;
  dapple: string;
  dappleOpacity: number;
  candleGlow: number;
  fireflies: number;
  clay: string;
  clayShade: string;
  wax: string;
  waxShade: string;
};

const shared = { clay: '#c46b42', clayShade: '#8e4429', wax: '#f4e6cd', waxShade: '#d8c2a0' };

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
    wall: '#cdbca3',
    ground: '#b9a56a',
    groundShade: '#9c8a55',
    path: '#ead2a6',
    stone: '#dfd2bc',
    stoneShade: '#b6a58a',
    engraving: '#5e4e3e',
    leaf: '#a8703a',
    leafLight: '#d39a4c',
    wood: '#745038',
    dapple: '#fff0cc',
    dappleOpacity: 0.2,
    candleGlow: 0.15,
    fireflies: 0,
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
    wall: '#d0bfa5',
    ground: '#bba96a',
    groundShade: '#9e8d56',
    path: '#eed7aa',
    stone: '#e2d6c1',
    stoneShade: '#b9a98e',
    engraving: '#5e4e3e',
    leaf: '#ad763d',
    leafLight: '#d9a352',
    wood: '#745038',
    dapple: '#fff4d6',
    dappleOpacity: 0.24,
    candleGlow: 0.1,
    fireflies: 0,
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
    wall: '#c8b49a',
    ground: '#b49a5c',
    groundShade: '#957e48',
    path: '#e8c999',
    stone: '#dcccb2',
    stoneShade: '#b29e80',
    engraving: '#5e4e3e',
    leaf: '#a7652f',
    leafLight: '#d18f3f',
    wood: '#6e4a32',
    dapple: '#ffd690',
    dappleOpacity: 0.28,
    candleGlow: 0.35,
    fireflies: 0,
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
    wall: '#7f746d',
    ground: '#5a5440',
    groundShade: '#4a4535',
    path: '#8a7d6c',
    stone: '#9d9389',
    stoneShade: '#7e756c',
    engraving: '#3a322b',
    leaf: '#6a4430',
    leafLight: '#8a5a38',
    wood: '#4f3627',
    dapple: '#ffcf80',
    dappleOpacity: 0.12,
    candleGlow: 1,
    fireflies: 1,
  },
};
