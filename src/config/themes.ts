
import type { Theme } from '@/context/app-context'; // Assuming Theme type is defined here

export const themes: Theme[] = [
  {
    id: 'cyberpunk-cyan',
    name: 'Cyberpunk Cyan',
    description: 'Classic dark theme with neon cyan and magenta accents.',
    colors: {
      primary: '180 100% 50%', // Neon Cyan
      secondary: '300 100% 50%', // Neon Magenta
      accent: '300 100% 70%', // Brighter Magenta
    },
  },
  {
    id: 'vaporwave-pink',
    name: 'Vaporwave Pink',
    description: 'A retro theme with pink and teal highlights.',
    colors: {
      primary: '300 100% 65%', // Bright Pink
      secondary: '180 100% 60%', // Teal
      accent: '180 100% 75%', // Lighter Teal
    },
  },
   {
    id: 'matrix-green',
    name: 'Matrix Green',
    description: 'A hacker-style theme with dominant green tones.',
    colors: {
      primary: '120 100% 50%', // Matrix Green
      secondary: '0 0% 60%',    // Medium Gray
      accent: '120 100% 70%', // Lighter Green
    },
  },
   {
    id: 'outrun-sunset',
    name: 'Outrun Sunset',
    description: 'Vibrant sunset colors with pink, orange, and yellow.',
    colors: {
      primary: '330 100% 60%', // Hot Pink
      secondary: '30 100% 55%',  // Orange
      accent: '50 100% 60%',  // Yellow
    },
  },
  // Add more themes here if needed
];

export const defaultTheme = themes[0]; // Set the default theme
