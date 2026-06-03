// Design Tokens - FindIT Lost & Found Management System
export const Colors = {
  // Core Brand Colors - Professional Navy + Gold
  primary: '#1a2942',        // Deep Navy - Primary actions, backgrounds
  secondary: '#c9a961',      // Warm Gold - Accents, highlights
  accent: '#d4b294',         // Light Gold - Secondary accents

  // Semantic Colors
  success: '#5c8e6e',        // Sage Green - Success states
  warning: '#d4a574',        // Warm Amber - Caution, warnings
  error: '#c74545',          // Warm Red - Errors
  info: '#4a7ba7',           // Blue-Gray - Information

  // Neutral Scale (Warm Grays)
  slate: {
    50: '#faf9f7',           // Near-white cream
    100: '#f5f0eb',          // Cream background
    200: '#e8e3db',          // Light cream
    300: '#d9d1c7',          // Warm gray light
    400: '#c4b8ad',          // Warm gray mid
    500: '#9d938a',          // Warm gray
    600: '#6b6259',          // Warm gray dark
    700: '#4a4239',          // Dark brown-gray
    800: '#2f2b27',          // Very dark
    900: '#1a1815',          // Almost black
  },

  // Status Colors
  status: {
    pending: '#d4a574',      // Warm Amber
    active: '#1a2942',       // Navy
    success: '#5c8e6e',      // Sage Green
    error: '#c74545',        // Warm Red
    warning: '#d4a574',      // Warm Amber
    neutral: '#9d938a',      // Warm Gray
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #1a2942 0%, #0f1927 100%)',
    secondary: 'linear-gradient(135deg, #c9a961 0%, #b8935a 100%)',
    success: 'linear-gradient(135deg, #5c8e6e 0%, #4a7159 100%)',
  },

  // Text Colors
  text: {
    primary: '#1a1815',      // Dark brown
    secondary: '#6b6259',    // Medium brown
    tertiary: '#9d938a',     // Light brown
    muted: '#c4b8ad',        // Muted brown
    inverse: '#FFFFFF',
  },

  // Background Colors
  bg: {
    primary: '#FFFFFF',
    secondary: '#faf9f7',    // Cream-50
    tertiary: '#f5f0eb',     // Cream-100
    hover: '#e8e3db',        // Cream-200
    dark: '#1a2942',         // Navy
  },

  // Border Colors
  border: {
    light: '#e8e3db',        // Cream-200
    default: '#d9d1c7',      // Cream-300
    dark: '#c4b8ad',         // Cream-400
  },
};

export const Typography = {
  fontFamily: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "Monaco", monospace',
  },

  fontSize: {
    display: { size: '32px', lineHeight: '1.2', weight: 700 },
    h1: { size: '28px', lineHeight: '1.3', weight: 700 },
    h2: { size: '24px', lineHeight: '1.3', weight: 700 },
    h3: { size: '20px', lineHeight: '1.3', weight: 600 },
    h4: { size: '18px', lineHeight: '1.4', weight: 600 },
    h5: { size: '16px', lineHeight: '1.4', weight: 600 },
    body: { size: '14px', lineHeight: '1.6', weight: 400 },
    bodySmall: { size: '13px', lineHeight: '1.5', weight: 400 },
    caption: { size: '12px', lineHeight: '1.5', weight: 500 },
    label: { size: '13px', lineHeight: '1.5', weight: 500 },
  },

  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const Spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

export const BorderRadius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
};

export const Shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  sm: '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
  '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
};

export const Transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slowest: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const ZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Breakpoints for responsive design
export const Breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
