'use client';

import { useEffect } from 'react';

const DEFAULT_PRIMARY = '#10B981';
const DEFAULT_PRIMARY_DARK = '#059669';
const DEFAULT_PRIMARY_SOFT = 'rgba(16,185,129,0.12)';
const DEFAULT_PRIMARY_LIGHT = 'rgba(16,185,129,0.08)';

const applyTheme = (primary: string, primaryDark: string) => {
  const soft = DEFAULT_PRIMARY_SOFT;
  const light = DEFAULT_PRIMARY_LIGHT;
  const gradient = `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`;

  const styleId = 'mk-theme-override';
  const css = `
:root {
  --primary-green: ${primary};
  --primary-green-strong: ${primaryDark};
  --primary-green-light: ${light};
  --primary-green-soft: ${soft};
  --primary-green-gradient: ${gradient};
}
`;
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = css;
};

export default function ThemeLoader() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mk-theme');
      if (stored) {
        const parsed = JSON.parse(stored) as { primary?: string; primaryDark?: string };
        applyTheme(parsed.primary || DEFAULT_PRIMARY, parsed.primaryDark || DEFAULT_PRIMARY_DARK);
      } else {
        applyTheme(DEFAULT_PRIMARY, DEFAULT_PRIMARY_DARK);
      }
    } catch (err) {
      console.error('Failed to load theme', err);
      applyTheme(DEFAULT_PRIMARY, DEFAULT_PRIMARY_DARK);
    }
  }, []);

  return null;
}

