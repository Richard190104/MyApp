
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const defaultLightTheme = {
  mode: 'light',
  background: '#ffffff',
  text: '#000000',
  card: '#f2f2f2',
  primary: '#70ABAF',
  bottombar: '#dcdcdc',
  success: '#28a745',
  danger: '#dc3545',
  buttonBackground: '#70ABAF',   
  buttonTextColor: '#ffffff',
};

export const defaultDarkTheme = {
  mode: 'dark',
  background: '#121212',
  text: '#e0e0e0',
  card: '#2a2a2a',
  primary: '#70ABAF',
  bottombar: '#3a3a3a',
  success: '#28a745',
  danger: '#dc3545',
  buttonBackground: '#70ABAF',   
  buttonTextColor: '#ffffff',
};

export type Theme = typeof defaultLightTheme;

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setCustomTheme: (newTheme: Theme) => void;
}>( {
  theme: defaultLightTheme,
  toggleTheme: () => {},
  setCustomTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultLightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('customTheme');
      if (storedTheme) {
        setTheme(JSON.parse(storedTheme));
      }
    };
    loadTheme();
  }, []);

 const toggleTheme = async () => {
  const newTheme = theme.mode === 'light' ? defaultDarkTheme : defaultLightTheme;
  setTheme(newTheme);
  await AsyncStorage.removeItem('customTheme'); 
};

  const setCustomTheme = (customTheme: Theme) => {
    if (customTheme.background && customTheme.text && customTheme.primary) {
      setTheme(customTheme);
      AsyncStorage.setItem('customTheme', JSON.stringify(customTheme));
    } else {
      console.error('Invalid custom theme:', customTheme);
    }
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
