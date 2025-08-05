const tokens = require('./nova-works.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'dashboard-bg': tokens.colors['dashboard-bg'],
        'dashboard-card': tokens.colors['dashboard-card'],
        'dashboard-text': tokens.colors['dashboard-text'],
        'dashboard-text-muted': tokens.colors['dashboard-text-muted'],
        'dashboard-border': tokens.colors['dashboard-border'],
        'dashboard-success': tokens.colors['dashboard-success'],
        'dashboard-danger': tokens.colors['dashboard-danger'],
        primary: tokens.colors.primary,
        'sidebar-background': tokens.colors['sidebar-background'],
        'sidebar-foreground': tokens.colors['sidebar-foreground'],
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily, 'sans-serif'],
      },
      spacing: {
        'container': tokens.spacing.container,
        'dashboard': tokens.spacing.dashboard,
        'card': tokens.spacing.card,
      },
      borderRadius: {
        'base': tokens.borderRadius.base,
      },
    },
  },
};