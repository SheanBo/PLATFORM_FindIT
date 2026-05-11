// Design Tokens - Single source of truth for design system
export const Colors = {
  // Core Colors
  primary: '#2563EB',        // Blue-600 - Main actions, links
  secondary: '#64748B',      // Slate-500 - Secondary actions
  accent: '#DC2626',         // Red-600 - Important, destructive

  // Semantic Colors
  success: '#16A34A',        // Green-600 - Success states
  warning: '#EA580C',        // Orange-600 - Caution, warnings
  error: '#DC2626',          // Red-600 - Errors
  info: '#0EA5E9',           // Sky-500 - Information

  // Neutral Scale (Slate)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Status Colors
  status: {
    pending: '#EA580C',      // Orange
    active: '#2563EB',       // Blue
    success: '#16A34A',      // Green
    error: '#DC2626',        // Red
    warning: '#EA580C',      // Orange
    neutral: '#94A3B8',      // Slate
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    success: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
    warning: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
  },

  // Text Colors
  text: {
    primary: '#0F172A',      // Slate-900
    secondary: '#64748B',    // Slate-500
    tertiary: '#94A3B8',     // Slate-400
    muted: '#CBD5E1',        // Slate-300
    inverse: '#FFFFFF',
  },

  // Background Colors
  bg: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',    // Slate-50
    tertiary: '#F1F5F9',     // Slate-100
    hover: '#E2E8F0',        // Slate-200
  },

  // Border Colors
  border: {
    light: '#E2E8F0',        // Slate-200
    default: '#CBD5E1',      // Slate-300
    dark: '#94A3B8',         // Slate-400
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
