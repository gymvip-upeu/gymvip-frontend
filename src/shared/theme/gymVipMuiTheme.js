import { createTheme } from '@mui/material/styles';

export const gymVipDesignTokens = {
  palette: {
    bgCanvas: '#0B0D12',
    bgSurface: '#141822',
    bgElevated: '#1C2230',
    goldPrimary: '#D4AF37',
    goldLight: '#E6C762',
    goldDark: '#A8861D',
    textPrimary: '#F5F6FA',
    textSecondary: '#A8B0C2',
    success: '#2EBD85',
    warning: '#F0B90B',
    error: '#E55353',
    info: '#4DA3FF',
    borderSubtle: 'rgba(212, 175, 55, 0.20)',
  },
  radius: 12,
};

export const gymVipMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: gymVipDesignTokens.palette.goldPrimary,
      light: gymVipDesignTokens.palette.goldLight,
      dark: gymVipDesignTokens.palette.goldDark,
      contrastText: '#0B0D12',
    },
    secondary: {
      main: gymVipDesignTokens.palette.info,
      contrastText: '#0B0D12',
    },
    background: {
      default: gymVipDesignTokens.palette.bgCanvas,
      paper: gymVipDesignTokens.palette.bgSurface,
    },
    text: {
      primary: gymVipDesignTokens.palette.textPrimary,
      secondary: gymVipDesignTokens.palette.textSecondary,
    },
    success: { main: gymVipDesignTokens.palette.success },
    warning: { main: gymVipDesignTokens.palette.warning },
    error: { main: gymVipDesignTokens.palette.error },
    divider: gymVipDesignTokens.palette.borderSubtle,
  },
  shape: {
    borderRadius: gymVipDesignTokens.radius,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${gymVipDesignTokens.palette.borderSubtle}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: gymVipDesignTokens.palette.bgSurface,
          border: `1px solid ${gymVipDesignTokens.palette.borderSubtle}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default gymVipMuiTheme;
