export interface Theme {
  id: string;
  name: string;
  colors: {
    '--background': string;
    '--foreground': string;
    '--card': string;
    '--card-foreground': string;
    '--popover': string;
    '--popover-foreground': string;
    '--primary': string;
    '--primary-foreground': string;
    '--secondary': string;
    '--secondary-foreground': string;
    '--muted': string;
    '--muted-foreground': string;
    '--accent': string;
    '--accent-foreground': string;
    '--destructive': string;
    '--destructive-foreground': string;
    '--border': string;
    '--input': string;
    '--ring': string;
    '--radius': string;
    '--sidebar-background': string;
    '--sidebar-foreground': string;
    '--sidebar-primary': string;
    '--sidebar-primary-foreground': string;
    '--sidebar-accent': string;
    '--sidebar-accent-foreground': string;
    '--sidebar-border': string;
    '--sidebar-ring': string;
    '--chart-1': string;
    '--chart-2': string;
    '--chart-3': string;
    '--chart-4': string;
    '--chart-5': string;
  };
}

export const defaultThemeId = 'cyberpunk-cyan';

export const themes: Theme[] = [
  {
    id: 'cyberpunk-cyan',
    name: 'Cyberpunk Cyan (Default)',
    colors: {
      '--background': '0 0% 3.9%', // Near black
      '--foreground': '0 0% 98%', // Near white
      '--card': '0 0% 5.5%', // Slightly lighter black
      '--card-foreground': '0 0% 98%',
      '--popover': '0 0% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '180 100% 50%', // Neon Cyan
      '--primary-foreground': '180 100% 10%', // Dark Cyan for text on primary
      '--secondary': '260 100% 60%', // Neon Purple / Magenta
      '--secondary-foreground': '260 100% 15%', // Dark Purple for text on secondary
      '--muted': '0 0% 14.9%',
      '--muted-foreground': '0 0% 63.9%',
      '--accent': '180 100% 40%', // Darker Cyan
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 84.2% 60.2%', // Red
      '--destructive-foreground': '0 0% 98%',
      '--border': '0 0% 14.9%',
      '--input': '0 0% 14.9%',
      '--ring': '180 100% 50%', // Neon Cyan for focus rings
      '--radius': '0.75rem',
      '--sidebar-background': '0 0% 5.5%',
      '--sidebar-foreground': '0 0% 75%',
      '--sidebar-primary': '180 100% 50%',
      '--sidebar-primary-foreground': '0 0% 98%',
      '--sidebar-accent': '260 100% 60%',
      '--sidebar-accent-foreground': '0 0% 98%',
      '--sidebar-border': '0 0% 14.9%',
      '--sidebar-ring': '180 100% 50%',
      '--chart-1': '180 70% 60%', // Cyan
      '--chart-2': '260 70% 70%', // Purple
      '--chart-3': '330 70% 65%', // Pinkish
      '--chart-4': '120 60% 60%', // Green
      '--chart-5': '45 80% 60%',  // Orange
    },
  },
  // Add more themes here if they were part of a5b0e2a0
];
