// import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
// import type { ThemeColor } from '@/types';

// type ThemeMode = 'light' | 'dark' | 'system';

// interface ThemeContextType {
//   mode: ThemeMode;
//   setMode: (mode: ThemeMode) => void;
//   primaryColor: ThemeColor;
//   setPrimaryColor: (color: ThemeColor) => void;
//   isDark: boolean;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// const colorThemes: Record<ThemeColor, { primary: string; secondary: string; accent: string }> = {
//   indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899' },
//   blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#8b5cf6' },
//   green: { primary: '#10b981', secondary: '#06b6d4', accent: '#84cc16' },
//   red: { primary: '#ef4444', secondary: '#f97316', accent: '#eab308' },
//   purple: { primary: '#8b5cf6', secondary: '#d946ef', accent: '#f43f5e' },
//   orange: { primary: '#f97316', secondary: '#eab308', accent: '#22c55e' },
//   pink: { primary: '#ec4899', secondary: '#f43f5e', accent: '#8b5cf6' },
//   cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#10b981' }
// };

// export function ThemeProvider({ children }: { children: ReactNode }) {
//   const [mode, setModeState] = useState<ThemeMode>('light');
//   const [primaryColor, setPrimaryColorState] = useState<ThemeColor>('indigo');
//   const [isDark, setIsDark] = useState(false);

//   useEffect(() => {
//     const savedMode = localStorage.getItem('pos_theme_mode') as ThemeMode;
//     const savedColor = localStorage.getItem('pos_theme_color') as ThemeColor;
    
//     if (savedMode) setModeState(savedMode);
//     if (savedColor) setPrimaryColorState(savedColor);
//   }, []);

//   useEffect(() => {
//     const applyTheme = () => {
//       const root = document.documentElement;
//       const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
//       setIsDark(dark);
      
//       if (dark) {
//         root.classList.add('dark');
//       } else {
//         root.classList.remove('dark');
//       }
//     };

//     applyTheme();

//     if (mode === 'system') {
//       const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//       const handler = () => applyTheme();
//       mediaQuery.addEventListener('change', handler);
//       return () => mediaQuery.removeEventListener('change', handler);
//     }
//   }, [mode]);

//   useEffect(() => {
//     const root = document.documentElement;
//     const colors = colorThemes[primaryColor];
    
//     root.style.setProperty('--primary', colors.primary);
//     root.style.setProperty('--secondary', colors.secondary);
//     root.style.setProperty('--accent', colors.accent);
//   }, [primaryColor]);

//   const setMode = (newMode: ThemeMode) => {
//     setModeState(newMode);
//     localStorage.setItem('pos_theme_mode', newMode);
//   };

//   const setPrimaryColor = (color: ThemeColor) => {
//     setPrimaryColorState(color);
//     localStorage.setItem('pos_theme_color', color);
//   };

//   const value: ThemeContextType = {
//     mode,
//     setMode,
//     primaryColor,
//     setPrimaryColor,
//     isDark
//   };

//   return (
//     <ThemeContext.Provider value={value}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme() {
//   const context = useContext(ThemeContext);
//   if (context === undefined) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// }
// hooks/useTheme.ts
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ThemeColor, ThemeConfig } from '@/types';
import { useSettings } from './useSettings';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  primaryColor: ThemeColor;
  setPrimaryColor: (color: ThemeColor) => void;
  isDark: boolean;
  themeConfig: ThemeConfig | null;
  setThemeConfig: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorThemes: Record<ThemeColor, { primary: string; secondary: string; accent: string }> = {
  indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899' },
  blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#8b5cf6' },
  green: { primary: '#10b981', secondary: '#06b6d4', accent: '#84cc16' },
  red: { primary: '#ef4444', secondary: '#f97316', accent: '#eab308' },
  purple: { primary: '#8b5cf6', secondary: '#d946ef', accent: '#f43f5e' },
  orange: { primary: '#f97316', secondary: '#eab308', accent: '#22c55e' },
  pink: { primary: '#ec4899', secondary: '#f43f5e', accent: '#8b5cf6' },
  cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#10b981' }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColorState] = useState<ThemeColor>('pink');
  const [themeConfig, setThemeConfigState] = useState<ThemeConfig | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Load theme config from settings when available
  useEffect(() => {
    if (settings?.themeConfig) {
      console.log('Loading theme config from settings:', settings.themeConfig);
      setThemeConfigState(settings.themeConfig);
      
      // Apply theme config to CSS variables
      const { primaryHue, primarySaturation, primaryLightness, borderRadius } = settings.themeConfig;
      const root = document.documentElement;
      
      root.style.setProperty('--theme-hue', String(primaryHue));
      root.style.setProperty('--theme-saturation', `${primarySaturation}%`);
      root.style.setProperty('--theme-lightness', `${primaryLightness}%`);
      root.style.setProperty('--primary', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
      
      // Calculate foreground color
      const isDarkTheme = primaryLightness < 50;
      const foregroundLightness = isDarkTheme ? 98 : 2;
      root.style.setProperty('--primary-foreground', `${primaryHue} ${primarySaturation}% ${foregroundLightness}%`);
      root.style.setProperty('--ring', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
      root.style.setProperty('--radius', `${borderRadius}rem`);
    }
  }, [settings]);

  // Load saved theme mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('pos_theme_mode') as ThemeMode;
    const savedColor = localStorage.getItem('pos_theme_color') as ThemeColor;
    
    if (savedMode) setModeState(savedMode);
    if (savedColor) setPrimaryColorState(savedColor);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(dark);
      
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  // Apply theme colors from config if available
  useEffect(() => {
    const root = document.documentElement;
    
    if (themeConfig) {
      const { primaryHue, primarySaturation, primaryLightness, borderRadius } = themeConfig;
      
      root.style.setProperty('--theme-hue', String(primaryHue));
      root.style.setProperty('--theme-saturation', `${primarySaturation}%`);
      root.style.setProperty('--theme-lightness', `${primaryLightness}%`);
      root.style.setProperty('--primary', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
      
      // Calculate foreground color
      const isDarkTheme = primaryLightness < 50;
      const foregroundLightness = isDarkTheme ? 98 : 2;
      root.style.setProperty('--primary-foreground', `${primaryHue} ${primarySaturation}% ${foregroundLightness}%`);
      root.style.setProperty('--ring', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
      root.style.setProperty('--radius', `${borderRadius}rem`);
    } else {
      // Fallback to default color themes
      const colors = colorThemes[primaryColor];
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--secondary', colors.secondary);
      root.style.setProperty('--accent', colors.accent);
    }
  }, [primaryColor, themeConfig]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('pos_theme_mode', newMode);
  };

  const setPrimaryColor = (color: ThemeColor) => {
    setPrimaryColorState(color);
    localStorage.setItem('pos_theme_color', color);
  };

  const setThemeConfig = (config: ThemeConfig) => {
    setThemeConfigState(config);
  };

  const value: ThemeContextType = {
    mode,
    setMode,
    primaryColor,
    setPrimaryColor,
    isDark,
    themeConfig,
    setThemeConfig
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}