import { createTheme } from '@mui/material/styles';

export const operationalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d4af37', contrastText: '#10131a' },
    success: { main: '#2ecc71' },
    warning: { main: '#d4af37' },
    error: { main: '#e74c3c' },
    background: { default: '#10131a', paper: '#171b24' },
    text: { primary: '#f5f2e9', secondary: '#b5bdca' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: { styleOverrides: { root: { border: '1px solid #434b58' } } },
    MuiButton: { defaultProps: { variant: 'contained' } },
  },
});
