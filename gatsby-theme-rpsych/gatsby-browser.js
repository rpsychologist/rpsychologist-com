import "katex/dist/katex.min.css"
//import "prismjs/themes/prism-solarizedlight.css"
import "./src/styles/styles.css"
import { ThemeProvider } from './src/components/ThemeContext'


export const wrapRootElement = ({ element }) => {
    return (
     <ThemeProvider>
       {element}
     </ThemeProvider>
    );
   };