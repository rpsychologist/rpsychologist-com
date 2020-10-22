import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';


let theme = createMuiTheme({
  palette: {
    background: {
      default: '#fff',
      appBar: '#000',
    },
  },
  typography: {
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    }
  },
});
theme = responsiveFontSizes(theme);
export default theme;

