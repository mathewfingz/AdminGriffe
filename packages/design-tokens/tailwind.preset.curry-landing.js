const tokens = require('./curry-landing.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'design-background': tokens.colors.background,
        'design-primary': tokens.colors.primary,
        'design-primary-light': tokens.colors['primary-light'],
        'design-foreground-high': tokens.colors['foreground-high'],
        'design-foreground-default': tokens.colors['foreground-default'],
        'design-foreground-low': tokens.colors['foreground-low'],
        'design-outline': tokens.colors.outline,
        'design-surface': tokens.colors.surface,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily, 'sans-serif'],
      },
      spacing: {
        'container': tokens.spacing.container,
        'form': tokens.spacing.form,
        'component': tokens.spacing.component,
      },
      borderRadius: {
        'base': tokens.borderRadius.base,
        'special': tokens.borderRadius.special,
      },
      boxShadow: {
        'card': tokens.shadows.card,
      },
    },
  },
};