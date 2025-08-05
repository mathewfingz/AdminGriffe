const tokens = require('./pixel-verse.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'griffe-navy': tokens.colors.navy,
        'griffe-blue': tokens.colors.blue,
        'griffe-blue-light': tokens.colors['blue-light'],
        'griffe-white': tokens.colors.white,
        'griffe-gray-high': tokens.colors['gray-high'],
        'griffe-gray-default': tokens.colors['gray-default'],
        'griffe-gray-low': tokens.colors['gray-low'],
        'griffe-border': tokens.colors.border,
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
        'large': tokens.borderRadius.large,
      },
    },
  },
};