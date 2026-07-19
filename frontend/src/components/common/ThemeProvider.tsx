import React, { createContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      document.body.classList.remove('light-theme');
      root.style.setProperty('--eotc-canvas',      '#0a0809'); // Rich dark plum/charcoal canvas
      root.style.setProperty('--eotc-surface',     '#111014');
      root.style.setProperty('--eotc-burgundy',    '#800020');
      root.style.setProperty('--eotc-burgundy-2',  '#621527');
      root.style.setProperty('--eotc-gold',        '#D4AF37');
      root.style.setProperty('--eotc-gold-dark',   '#A88820');
      root.style.setProperty('--eotc-text',        '#F2EEEE'); // Muted white text
      root.style.setProperty('--eotc-text-muted',  '#A69C9E');
      root.style.setProperty('--eotc-border',      'rgba(212,175,55,0.14)');
      root.style.setProperty('--eotc-card',        '#1a1619');
      root.style.setProperty('--eotc-card-hover',  '#231f22');

      // Legacy compatibility
      root.style.setProperty('--bg-dark',         '#0a0809');
      root.style.setProperty('--primary-gold',    '#D4AF37');
      root.style.setProperty('--text-primary',    '#F2EEEE');
      root.style.setProperty('--card-bg',         '#1a1619');
      
      document.body.style.backgroundColor = '#0a0809';
      document.body.style.color           = '#F2EEEE';
    } else {
      document.body.classList.add('light-theme');
      root.style.setProperty('--eotc-canvas',      '#FAFADA'); // Light sandalwood ivory
      root.style.setProperty('--eotc-surface',     '#FFFFFF');
      root.style.setProperty('--eotc-burgundy',    '#800000');
      root.style.setProperty('--eotc-burgundy-2',  '#A00000');
      root.style.setProperty('--eotc-gold',        '#D4AF37');
      root.style.setProperty('--eotc-gold-dark',   '#A8871A');
      root.style.setProperty('--eotc-text',        '#1A1A1A'); // Deep slate
      root.style.setProperty('--eotc-text-muted',  '#555555');
      root.style.setProperty('--eotc-border',      'rgba(212,175,55,0.25)');
      root.style.setProperty('--eotc-card',        '#FFFFFF');
      root.style.setProperty('--eotc-card-hover',  '#F5F5F5');

      // Legacy compatibility
      root.style.setProperty('--bg-dark',         '#FAFADA');
      root.style.setProperty('--primary-gold',    '#D4AF37');
      root.style.setProperty('--text-primary',    '#1A1A1A');
      root.style.setProperty('--card-bg',         '#FFFFFF');

      document.body.style.backgroundColor = '#FAFADA';
      document.body.style.color           = '#1A1A1A';
    }

    // Typography
    root.style.setProperty('--font-primary',   "'Outfit', 'Inter', sans-serif");
    root.style.setProperty('--font-secondary', "'Playfair Display', Georgia, serif");
    document.body.style.fontFamily      = "'Outfit', 'Inter', sans-serif";
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
