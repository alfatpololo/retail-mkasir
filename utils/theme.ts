/**
 * Theme management utility
 */

export interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  gradient: string; // Multi-color fun gradient
}

export const THEMES: ThemeColor[] = [
  {
    id: 'emerald',
    name: 'Hijau',
    primary: '#16a34a',
    primaryDark: '#0f7d36',
    primaryLight: '#ecfdf3',
    primarySoft: '#d1fae5',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #064e3b 100%)',
  },
  {
    id: 'blue',
    name: 'Biru',
    primary: '#2563eb',
    primaryDark: '#1e40af',
    primaryLight: '#eff6ff',
    primarySoft: '#dbeafe',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 25%, #1d4ed8 50%, #1e40af 75%, #1e3a8a 100%)',
  },
  {
    id: 'purple',
    name: 'Ungu',
    primary: '#9333ea',
    primaryDark: '#7e22ce',
    primaryLight: '#faf5ff',
    primarySoft: '#f3e8ff',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 25%, #7e22ce 50%, #6b21a8 75%, #581c87 100%)',
  },
  {
    id: 'pink',
    name: 'Merah Muda',
    primary: '#db2777',
    primaryDark: '#be185d',
    primaryLight: '#fdf2f8',
    primarySoft: '#fce7f3',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 25%, #be185d 50%, #9f1239 75%, #831843 100%)',
  },
  {
    id: 'red',
    name: 'Merah',
    primary: '#dc2626',
    primaryDark: '#b91c1c',
    primaryLight: '#fef2f2',
    primarySoft: '#fee2e2',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 25%, #b91c1c 50%, #991b1b 75%, #7f1d1d 100%)',
  },
  {
    id: 'orange',
    name: 'Oranye',
    primary: '#ea580c',
    primaryDark: '#c2410c',
    primaryLight: '#fff7ed',
    primarySoft: '#ffedd5',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 25%, #c2410c 50%, #9a3412 75%, #7c2d12 100%)',
  },
  {
    id: 'amber',
    name: 'Amber',
    primary: '#d97706',
    primaryDark: '#b45309',
    primaryLight: '#fffbeb',
    primarySoft: '#fef3c7',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 25%, #b45309 50%, #92400e 75%, #78350f 100%)',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    primary: '#0891b2',
    primaryDark: '#0e7490',
    primaryLight: '#ecfeff',
    primarySoft: '#cffafe',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 25%, #0e7490 50%, #155e75 75%, #164e63 100%)',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    primaryLight: '#eef2ff',
    primarySoft: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 25%, #4338ca 50%, #3730a3 75%, #312e81 100%)',
  },
  {
    id: 'teal',
    name: 'Teal',
    primary: '#0d9488',
    primaryDark: '#0f766e',
    primaryLight: '#f0fdfa',
    primarySoft: '#ccfbf1',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 25%, #0f766e 50%, #115e59 75%, #134e4a 100%)',
  },
];

const THEME_STORAGE_KEY = 'mkasir_theme';

export function getCurrentTheme(): ThemeColor {
  if (typeof window === 'undefined') return THEMES[0];

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const themeId = JSON.parse(stored);
      const theme = THEMES.find((t) => t.id === themeId);
      if (theme) return theme;
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }

  return THEMES[0]; // default to emerald
}

export function setTheme(themeId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeId));
    applyTheme(themeId);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

export function applyTheme(themeId: string): void {
  if (typeof window === 'undefined') return;

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--primary-color-dark', theme.primaryDark);
  root.style.setProperty('--primary-color-light', theme.primaryLight);
  root.style.setProperty('--primary-color-soft', theme.primarySoft);
  root.style.setProperty('--primary-gradient', theme.gradient);
}

