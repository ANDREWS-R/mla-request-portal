import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#064e3b', // Deep Kerala Forest Green
      light: '#0f766e',
      dark: '#022c22',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d97706', // Warm Amber Gold
      light: '#f59e0b',
      dark: '#92400e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fbfbf9', // Warm off-white
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',  // Gray-900
      secondary: '#4b5563', // Gray-600
    },
    divider: '#e5e7eb', // Gray-200
    error: {
      main: '#b91c1c',
    },
    warning: {
      main: '#d97706',
    },
    success: {
      main: '#047857',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      color: '#064e3b',
    },
    h2: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      color: '#064e3b',
    },
    h3: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      color: '#064e3b',
    },
    h4: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      color: '#064e3b',
    },
    h5: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      color: '#111827',
    },
    h6: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 500,
      color: '#111827',
    },
    button: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#064e3b',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderBottom: '3px solid #d97706',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          borderRadius: 12,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#064e3b',
          '&:hover': {
            backgroundColor: '#022c22',
          },
        },
        containedSecondary: {
          backgroundColor: '#d97706',
          '&:hover': {
            backgroundColor: '#b45309',
          },
        },
      },
    },
  },
});

export default theme;
