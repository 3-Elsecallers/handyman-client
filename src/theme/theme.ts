import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#66BB6A',
      light: '#A5D6A7',
      dark: '#1B5E20',
      contrastText: '#E8F5E9',
    },

    secondary: {
      main: '#1B5E20',
      light: '#66BB6A',
      dark: '#124116',
      contrastText: '#E8F5E9',
    },

    background: {
      default: '#E8F5E9',
      paper: '#A5D6A7',
    },

    text: {
      primary: '#1B5E20',
      secondary: '#66BB6A',
      disabled: '#6B8E6B',
    },

    divider: '#A5D6A7',
  },

  typography: {
    fontFamily: 'inherit',

    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },

    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',

          '&:hover': {
            boxShadow: 'none',
          },
        },

        contained: {
          '&:hover': {
            backgroundColor: '#1B5E20',
          },
        },

        outlined: {
          borderColor: '#66BB6A',

          '&:hover': {
            backgroundColor: '#66BB6A',
            color: '#E8F5E9',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#66BB6A',
          },

          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#66BB6A',
          },
        },
      },
    },
  },
});

export default theme;