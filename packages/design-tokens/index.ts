import pixelVerse from './pixel-verse.json';
import curryLanding from './curry-landing.json';
import novaHaven from './nova-haven.json';
import novaWorks from './nova-works.json';

export const themes = {
  'pixel-verse': pixelVerse,
  'curry-landing': curryLanding,
  'nova-haven': novaHaven,
  'nova-works': novaWorks,
} as const;

export type ThemeName = keyof typeof themes;

export const getTheme = (name: ThemeName) => themes[name];

export { pixelVerse, curryLanding, novaHaven, novaWorks };