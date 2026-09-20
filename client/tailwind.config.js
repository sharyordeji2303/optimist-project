/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // One neutral family (cool concrete greys) plus a single accent.
        // Tokens resolve through CSS variables so light and dark stay in sync.
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Geist Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Editorial display scale. Fluid, so it never needs a breakpoint jump,
        // and capped so a headline stays inside the hero instead of overflowing.
        display: ['clamp(2.5rem, 6vw, 5.25rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.75rem, 3.4vw, 2.75rem)', { lineHeight: '1.06', letterSpacing: '-0.02em' }],
        lede: ['clamp(1.05rem, 1.6vw, 1.4rem)', { lineHeight: '1.5' }],
      },
      maxWidth: {
        shell: '1440px',
      },
      spacing: {
        gutter: 'clamp(1.25rem, 4vw, 4.5rem)',
      },
      transitionTimingFunction: {
        // House curve. Every transition and animation uses this, never `ease`.
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
