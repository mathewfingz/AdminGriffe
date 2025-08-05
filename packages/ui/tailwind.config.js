/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        'design-primary': '#2563eb',
        'design-primary-light': '#dbeafe',
        'design-surface': '#ffffff',
        'design-foreground-low': '#6b7280',
        'design-outline-default': '#d1d5db',
      },
    },
  },
  plugins: [],
};