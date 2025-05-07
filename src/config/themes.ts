
/**
 * @file Defines the available themes for the application.
 */

export interface Theme {
  id: string;
  name: string;
  className: string; // CSS class to be applied to the <html> tag
  previewColor: string; // A representative color for UI previews (e.g., primary or accent)
  variables: {
    background: string; // HSL format: "H S% L%"
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    // Sidebar specific colors (can be same as main if desired)
    sidebarBackground: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    // Chart colors
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    // Neon Text
    neonText: string;
  };
}

export const defaultThemeId = 'cyberpunk-cyan';

export const themes: Theme[] = [
  {
    id: 'cyberpunk-cyan',
    name: 'Cyberpunk Cyan',
    className: 'theme-cyberpunk-cyan',
    previewColor: 'hsl(180, 100%, 50%)',
    variables: {
      background: '0 0% 0%',
      foreground: '0 0% 95%',
      card: '0 0% 7%',
      cardForeground: '0 0% 95%',
      popover: '0 0% 7%',
      popoverForeground: '0 0% 95%',
      primary: '180 100% 50%', // Neon Cyan
      primaryForeground: '180 100% 10%',
      secondary: '300 100% 50%', // Neon Magenta
      secondaryForeground: '300 100% 10%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 60%',
      accent: '300 100% 70%',
      accentForeground: '0 0% 5%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '180 100% 30%',
      input: '0 0% 15%',
      ring: '180 100% 50%',
      sidebarBackground: '0 0% 5%',
      sidebarForeground: '0 0% 85%',
      sidebarPrimary: '180 100% 50%',
      sidebarPrimaryForeground: '180 100% 10%',
      sidebarAccent: '300 100% 70%',
      sidebarAccentForeground: '0 0% 5%',
      sidebarBorder: '180 100% 20%',
      sidebarRing: '180 100% 50%',
      chart1: '180 100% 50%', // Neon Cyan
      chart2: '300 100% 50%', // Neon Magenta
      chart3: '120 100% 50%', // Neon Green
      chart4: '60 100% 50%',  // Neon Yellow
      chart5: '30 100% 50%',   // Neon Orange
      neonText: '0 0% 90%',
    },
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave Sunset',
    className: 'theme-synthwave-sunset',
    previewColor: 'hsl(330, 100%, 55%)', // Deep Pink/Orange
    variables: {
      background: '260 30% 5%', // Dark Purple
      foreground: '0 0% 90%',
      card: '260 30% 10%',
      cardForeground: '0 0% 90%',
      popover: '260 30% 10%',
      popoverForeground: '0 0% 90%',
      primary: '330 100% 55%', // Neon Pink/Orange
      primaryForeground: '330 100% 15%',
      secondary: '30 100% 50%', // Neon Orange/Yellow
      secondaryForeground: '30 100% 10%',
      muted: '260 30% 20%',
      mutedForeground: '0 0% 65%',
      accent: '30 100% 65%',
      accentForeground: '260 30% 5%',
      destructive: '0 80% 60%',
      destructiveForeground: '0 0% 98%',
      border: '330 100% 35%',
      input: '260 30% 20%',
      ring: '330 100% 55%',
      sidebarBackground: '260 30% 8%',
      sidebarForeground: '0 0% 80%',
      sidebarPrimary: '330 100% 55%',
      sidebarPrimaryForeground: '330 100% 15%',
      sidebarAccent: '30 100% 65%',
      sidebarAccentForeground: '260 30% 5%',
      sidebarBorder: '330 100% 25%',
      sidebarRing: '330 100% 55%',
      chart1: '330 100% 55%',
      chart2: '30 100% 50%',
      chart3: '210 100% 50%', // Neon Blue
      chart4: '150 100% 50%', // Neon Teal
      chart5: '270 100% 60%', // Neon Purple
      neonText: '0 0% 88%',
    },
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    className: 'theme-matrix-green',
    previewColor: 'hsl(120, 100%, 50%)', // Bright Green
    variables: {
      background: '0 0% 2%', // Very Dark (almost black)
      foreground: '120 100% 70%', // Lighter Green
      card: '0 0% 5%',
      cardForeground: '120 100% 70%',
      popover: '0 0% 5%',
      popoverForeground: '120 100% 70%',
      primary: '120 100% 50%', // Neon Green
      primaryForeground: '120 100% 5%', // Dark Green
      secondary: '120 80% 30%', // Darker Neon Green
      secondaryForeground: '120 100% 80%',
      muted: '0 0% 10%',
      mutedForeground: '120 70% 50%',
      accent: '120 100% 65%',
      accentForeground: '0 0% 2%',
      destructive: '0 70% 50%',
      destructiveForeground: '0 0% 95%',
      border: '120 100% 25%',
      input: '0 0% 10%',
      ring: '120 100% 50%',
      sidebarBackground: '0 0% 3%',
      sidebarForeground: '120 100% 65%',
      sidebarPrimary: '120 100% 50%',
      sidebarPrimaryForeground: '120 100% 5%',
      sidebarAccent: '120 100% 65%',
      sidebarAccentForeground: '0 0% 2%',
      sidebarBorder: '120 100% 20%',
      sidebarRing: '120 100% 50%',
      chart1: '120 100% 50%',
      chart2: '120 80% 30%',
      chart3: '100 100% 50%', // Lime Green
      chart4: '140 100% 50%', // Greenish-Cyan
      chart5: '0 0% 60%',     // Gray for contrast
      neonText: '120 100% 75%',
    },
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    className: 'theme-electric-blue',
    previewColor: 'hsl(210, 100%, 55%)', // Bright Blue
    variables: {
      background: '220 40% 4%', // Very Dark Blue
      foreground: '0 0% 92%',
      card: '220 40% 8%',
      cardForeground: '0 0% 92%',
      popover: '220 40% 8%',
      popoverForeground: '0 0% 92%',
      primary: '210 100% 55%', // Neon Electric Blue
      primaryForeground: '210 100% 10%',
      secondary: '180 100% 45%', // Neon Cyan (complementary)
      secondaryForeground: '180 100% 5%',
      muted: '220 40% 15%',
      mutedForeground: '0 0% 70%',
      accent: '180 100% 60%',
      accentForeground: '220 40% 4%',
      destructive: '0 80% 55%',
      destructiveForeground: '0 0% 98%',
      border: '210 100% 30%',
      input: '220 40% 15%',
      ring: '210 100% 55%',
      sidebarBackground: '220 40% 6%',
      sidebarForeground: '0 0% 88%',
      sidebarPrimary: '210 100% 55%',
      sidebarPrimaryForeground: '210 100% 10%',
      sidebarAccent: '180 100% 60%',
      sidebarAccentForeground: '220 40% 4%',
      sidebarBorder: '210 100% 20%',
      sidebarRing: '210 100% 55%',
      chart1: '210 100% 55%',
      chart2: '180 100% 45%',
      chart3: '240 100% 60%', // Neon Indigo
      chart4: '270 100% 60%', // Neon Purple
      chart5: '300 100% 55%', // Neon Magenta
      neonText: '0 0% 90%',
    },
  },
  {
    id: 'crimson-code',
    name: 'Crimson Code',
    className: 'theme-crimson-code',
    previewColor: 'hsl(0, 100%, 50%)', // Bright Red
    variables: {
      background: '0 0% 3%', // Very Dark, almost black
      foreground: '0 0% 88%',
      card: '0 0% 6%',
      cardForeground: '0 0% 88%',
      popover: '0 0% 6%',
      popoverForeground: '0 0% 88%',
      primary: '0 100% 50%', // Neon Red
      primaryForeground: '0 100% 10%',
      secondary: '30 100% 45%', // Neon Orange
      secondaryForeground: '30 100% 5%',
      muted: '0 0% 12%',
      mutedForeground: '0 0% 60%',
      accent: '30 100% 60%',
      accentForeground: '0 0% 3%',
      destructive: '0 100% 40%', // Slightly darker red for destructive
      destructiveForeground: '0 0% 95%',
      border: '0 100% 28%',
      input: '0 0% 12%',
      ring: '0 100% 50%',
      sidebarBackground: '0 0% 4%',
      sidebarForeground: '0 0% 80%',
      sidebarPrimary: '0 100% 50%',
      sidebarPrimaryForeground: '0 100% 10%',
      sidebarAccent: '30 100% 60%',
      sidebarAccentForeground: '0 0% 3%',
      sidebarBorder: '0 100% 20%',
      sidebarRing: '0 100% 50%',
      chart1: '0 100% 50%',
      chart2: '30 100% 45%',
      chart3: '60 100% 45%', // Neon Yellow
      chart4: '330 100% 50%', // Neon Pink
      chart5: '0 0% 70%',     // Light Gray for contrast
      neonText: '0 0% 85%',
    },
  },
];
