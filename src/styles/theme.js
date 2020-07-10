import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles'

let theme = createMuiTheme({
  palette: {
    background: {
      paper: '#fff',
      default: 'white',
    },
  },
  typography: {
    fontSize: 16,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      marginTop: '3rem',
      marginBottom: '2rem',
      fontSize: '3.8rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.2rem',
      marginTop: '3rem',
      marginBottom: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '2rem',
      marginTop: '3rem',
      marginBottom: '1.5rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.8rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.6rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '1.4rem',
      fontWeight: 700,
    },
  },
})

theme = responsiveFontSizes(theme)
export default theme
