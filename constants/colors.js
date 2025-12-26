export const COLORS = {
  // Primary colors from Deliver Now brand
  primary: '#C13584',
  primaryDark: '#A02D6E',
  primaryLight: '#E84393',
  
  // Secondary colors
  secondary: '#8E44AD',
  accent: '#E91E63',
  
  // Background colors
  background: '#FFFFFF',
  backgroundDark: '#2D3436',
  backgroundLight: '#F5F5F5',
  
  // Dark theme colors for POS
  darkBg: '#2D3436',
  darkCard: '#3E4347',
  darkInput: '#4A5056',
  
  // Text colors
  text: '#2D3436',
  textLight: '#636E72',
  textDark: '#000000',
  textWhite: '#FFFFFF',
  textGray: '#999999',
  textMuted: '#666666',
  
  // Status colors
  success: '#27AE60',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  
  // UI colors
  border: '#DFE6E9',
  borderDark: '#4A5056',
  disabled: '#B2BEC3',
  shadow: '#000000',
  
  // Gradient colors
  gradient1: '#C13584',
  gradient2: '#8E44AD',
  
  // Payment method colors
  cashGreen: '#27AE60',
  cardBlue: '#3498DB',
  checkPurple: '#9B59B6',
};

export const SIZES = {
  // Font sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body: 16,
  small: 14,
  tiny: 12,
  
  // Spacing
  padding: 16,
  margin: 16,
  radius: 12,
  radiusSmall: 6,
  radiusMedium: 8,
  
  // Dimensions
  buttonHeight: 50,
  inputHeight: 50,
  iconSize: 24,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Export default for convenience
export default {
  COLORS,
  SIZES,
  SHADOWS,
};