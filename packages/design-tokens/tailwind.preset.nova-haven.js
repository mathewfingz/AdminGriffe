const tokens = require('./nova-haven.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: tokens.colors.background,
        foreground: tokens.colors.foreground,
        primary: tokens.colors.primary,
        'primary-foreground': tokens.colors['primary-foreground'],
        'sidebar-background': tokens.colors['sidebar-background'],
        'sidebar-foreground': tokens.colors['sidebar-foreground'],
        'sidebar-active': tokens.colors['sidebar-active'],
        muted: tokens.colors.muted,
        'muted-foreground': tokens.colors['muted-foreground'],
        border: tokens.colors.border,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily, 'sans-serif'],
      },
      spacing: {
        'container': tokens.spacing.container,
        'sidebar': tokens.spacing.sidebar,
        'content': tokens.spacing.content,
      },
      borderRadius: {
        'base': tokens.borderRadius.base,
      },
    },
  },
};