import { createTheme } from '@mui/material/styles';

const blueWhiteTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#34A853',
      light: '#5fbf78',
      dark: '#248a41',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#26DDF9',
      light: '#6be8fb',
      dark: '#13b7d0',
      contrastText: '#1F1F1F',
    },
    background: {
      default: '#F0F4F9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1F1F1F',
      secondary: '#9E9E9E',
      disabled: '#B0B0B0',
    },
    action: {
      hover: 'rgba(52, 168, 83, 0.08)',
      selected: 'rgba(52, 168, 83, 0.14)',
      disabledBackground: 'rgba(0, 0, 0, 0.04)',
    },
    divider: 'rgba(0, 0, 0, 0.14)',
    info: {
      main: '#111111',
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    htmlFontSize: 16,
    fontSize: 16,
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(1.5rem, 5vw, 3rem)',
    },
    h2: {
      fontWeight: 600,
      fontSize: 'clamp(1.25rem, 4vw, 2.25rem)',
    },
    h3: {
      fontWeight: 600,
      fontSize: 'clamp(1.125rem, 3.5vw, 1.75rem)',
    },
    body1: {
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
    },
    body2: {
      fontSize: 'clamp(0.8125rem, 2.25vw, 0.875rem)',
    },
    caption: {
      fontSize: 'clamp(0.6875rem, 2vw, 0.75rem)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '4px !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '4px !important',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
          },
        },
      },
    },
  },
});

export default blueWhiteTheme;

