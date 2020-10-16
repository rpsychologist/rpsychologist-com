import React from 'react';
import { ThemeProvider } from './src/components/ThemeContext'

export const wrapRootElement = ({ element }) => {
 return (
  <ThemeProvider>
    {element}
  </ThemeProvider>
 );
};