import React from 'react';
import useDarkMode from 'use-dark-mode';
import initialTheme from '../styles/theme'
import { ThemeProvider as MuiThemeProvider} from '@material-ui/core/styles'
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';

export const DarkModeContext = React.createContext();

export const ThemeProvider = ({ children }) => {
  const darkMode = useDarkMode(false);

  const theme = React.useMemo(() => {
    const updatedTheme = createMuiTheme({
      ...initialTheme,
      palette: {
        background: {
          default: darkMode.value ? '#121212' : '#fff',
          paper: darkMode.value  ? '#121212' : '#fff',
          appBar: darkMode.value  ? '#000' : '#fff',
        },
        type: darkMode.value  ? 'dark' : 'light'
      }
    })
    return responsiveFontSizes(updatedTheme)
  }, [darkMode.value]);

  return (
    <DarkModeContext.Provider value={darkMode}>
      <MuiThemeProvider theme={theme}>
      {children}
      </MuiThemeProvider>
    </DarkModeContext.Provider>
  );
};