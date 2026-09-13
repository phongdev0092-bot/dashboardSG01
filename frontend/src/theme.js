import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8', // Google Blue
      light: '#e8f0fe',
      dark: '#1557b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00897b', // Google Teal
      light: '#e0f2f1',
      dark: '#00695c',
    },
    success: {
      main: '#1e8e3e',
      light: '#e6f4ea',
    },
    warning: {
      main: '#f9ab00',
      light: '#fef7e0',
    },
    error: {
      main: '#d93025',
      light: '#fce8e6',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
    },
    divider: '#e8eaed',
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Segoe UI", sans-serif',
    h5: {
      fontWeight: 600,
      color: '#202124',
    },
    h6: {
      fontWeight: 600,
      color: '#202124',
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)',
          border: '1px solid #e8eaed',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
