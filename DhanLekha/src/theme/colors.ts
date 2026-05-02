export const LightTheme = {
  dark: false,
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceContainer: '#F1F5F9',
    surfaceContainerLow: '#F8FAFC',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerLowest: '#FFFFFF',
    onBackground: '#0F172A',
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    primary: '#0A192F',
    accent: '#14B8A6',
    brand: '#0A192F',
    navBackground: 'rgba(255,255,255,0.95)',
    headerBackground: 'rgba(255,255,255,0.9)',
    cardBorder: 'rgba(203,213,225,0.4)',
    glassBackground: '#FFFFFF', // Fully solid for better shadows
    glassBorder: 'rgba(255,255,255,1)',
    outlineVariant: '#CBD5E1',
    outline: '#94A3B8',
    shadowColor: '#000000',
    positiveColor: '#14B8A6',
    negativeColor: '#EF4444',
  },
};

export const DarkTheme = {
  dark: true,
  colors: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceContainer: '#1C2128',
    surfaceContainerLow: '#161B22',
    surfaceContainerHigh: '#272E38',
    surfaceContainerLowest: '#0D1117',
    onBackground: '#E6EDF3',
    onSurface: '#E6EDF3',
    onSurfaceVariant: '#8B949E',
    primary: '#B9C7E4',
    accent: '#41E4C0',
    brand: '#64FFDA',
    navBackground: 'rgba(13,17,23,0.95)',
    headerBackground: 'rgba(13,17,23,0.9)',
    cardBorder: 'rgba(255,255,255,0.06)',
    glassBackground: '#1A1D21', // Darker, solid background
    glassBorder: 'rgba(255,255,255,0.1)',
    outlineVariant: '#30363D',
    outline: '#484F58',
    shadowColor: '#000000',
    positiveColor: '#41E4C0',
    negativeColor: '#FF6B6B',
  },
};

export type ThemeColors = typeof LightTheme.colors;
export type Theme = typeof LightTheme;
