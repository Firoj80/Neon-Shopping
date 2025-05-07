
export interface Theme {
  id: string;
  name: string;
  previewColor: string; // For the theme selection UI
  // Add other theme-specific properties if needed (e.g., font, specific component styles)
}

export const themes: Theme[] = [
  {
    id: 'cyberpunk-cyan',
    name: 'Cyberpunk Cyan',
    previewColor: 'hsl(180, 100%, 50%)', // Neon Cyan
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave Sunset',
    previewColor: 'hsl(330, 100%, 55%)', // Neon Pink/Orange
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    previewColor: 'hsl(120, 100%, 50%)', // Neon Green
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    previewColor: 'hsl(210, 100%, 55%)', // Electric Blue
  },
  {
    id: 'crimson-code',
    name: 'Crimson Code',
    previewColor: 'hsl(0, 100%, 50%)', // Neon Red
  },
  // Add more themes here
];

export const defaultThemeId: string = 'cyberpunk-cyan'; // Set your preferred default theme ID

export const defaultTheme: Theme | undefined = themes.find(t => t.id === defaultThemeId);

if (!defaultTheme) {
  console.error(`Default theme with ID "${defaultThemeId}" not found. Falling back to the first theme.`);
}
