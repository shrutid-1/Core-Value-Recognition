import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // === TOUCHCORE VALUESPOT — BLUEPRINT DESIGN SYSTEM ===
        // Base surfaces (steel-blue monochrome palette)
        bg:             '#f2f2f3',
        surface:        '#e9e9ea',
        'surface-secondary': '#e2e2e3',
        divider:        'rgba(29,31,32,0.16)',
        text:           '#1d1f20',

        // Background alias (keep for backward compat)
        background:     '#f2f2f3',
        border:         'rgba(29,31,32,0.16)',

        // Text ramp
        'text-primary':   '#1d1f20',
        'text-secondary': '#5d5d60',
        'text-muted':     '#7a7a7d',
        'text-disabled':  '#98989b',

        // Neutral ramp
        'neutral-100': '#f5f5f8',
        'neutral-200': '#e7e7ea',
        'neutral-300': '#d4d4d7',
        'neutral-400': '#b7b7ba',
        'neutral-500': '#98989b',
        'neutral-600': '#7a7a7d',
        'neutral-700': '#5d5d60',
        'neutral-800': '#424244',
        'neutral-900': '#2b2b2d',

        // Accent ramp — primary steel blue
        accent:         '#5980a6',
        'accent-2':     '#728fab',
        'accent-100':   '#eef6ff',
        'accent-200':   '#d6ebff',
        'accent-300':   '#b5d9fd',
        'accent-400':   '#94bce3',
        'accent-500':   '#749dc4',
        'accent-600':   '#597ea3',
        'accent-700':   '#416180',
        'accent-800':   '#2c455d',
        'accent-900':   '#1d2d3d',

        // Accent-2 ramp
        'accent-2-100': '#eef6ff',
        'accent-2-300': '#bdd8f2',
        'accent-2-600': '#627d98',
        'accent-2-700': '#486077',
        'accent-2-800': '#314457',
        'accent-2-900': '#1f2d3a',

        // Per-value tone colors (fixed assignments — monochromatic accent family)
        'value-adaptable':    '#749dc4',  // accent-500
        'value-transparent':  '#627d98',  // accent-2-600
        'value-collaborative':'#2c455d',  // accent-800
        'value-innovative':   '#94bce3',  // accent-400
        'value-accountable':  '#416180',  // accent-700

        // Legacy tokens mapped to new system (backward compat)
        navy:   '#1d2d3d',
        blue:   { DEFAULT: '#5980a6', secondary: '#728fab' },
        teal:   '#627d98',
        success: '#416180',
        warning: '#749dc4',
        danger:  '#2c455d',
        info:    '#5980a6',

        // shadcn/ui required tokens
        input:       'rgba(29,31,32,0.16)',
        ring:        '#5980a6',
        foreground:  '#1d1f20',
        primary: {
          DEFAULT:    '#5980a6',
          foreground: '#f2f2f3',
        },
        secondary: {
          DEFAULT:    '#e9e9ea',
          foreground: '#1d1f20',
        },
        destructive: {
          DEFAULT:    '#2c455d',
          foreground: '#f2f2f3',
        },
        muted: {
          DEFAULT:    '#e9e9ea',
          foreground: '#7a7a7d',
        },
        card: {
          DEFAULT:    'transparent',
          foreground: '#1d1f20',
        },
        popover: {
          DEFAULT:    '#f2f2f3',
          foreground: '#1d1f20',
        },
        accent: {
          DEFAULT:    '#5980a6',
          foreground: '#f2f2f3',
        },
      },
      borderRadius: {
        // Blueprint design uses square corners everywhere
        DEFAULT: '0px',
        none:  '0px',
        sm:    '0px',
        md:    '0px',
        lg:    '0px',
        xl:    '0px',
        '2xl': '0px',
        '3xl': '0px',
        full:  '9999px', // only for true circles/pills when explicitly needed
      },
      fontFamily: {
        // Blueprint design system fonts
        sans:       ['"Barlow"', 'system-ui', '-apple-system', 'sans-serif'],
        condensed:  ['"Barlow Condensed"', '"Barlow"', 'system-ui', 'sans-serif'],
        mono:       ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Blueprint type scale
        '3xs': ['9px',  { lineHeight: '1.3' }],
        '2xs': ['10px', { lineHeight: '1.3' }],
        xs:    ['11px', { lineHeight: '1.4' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['15px', { lineHeight: '1.55' }],
        lg:    ['16px', { lineHeight: '1.5' }],
        xl:    ['20px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.25' }],
        '3xl': ['32px', { lineHeight: '1.15' }],
        '4xl': ['36px', { lineHeight: '1.1' }],
        '5xl': ['42px', { lineHeight: '1.1' }],
      },
      boxShadow: {
        sm:  '0 1px 2px rgba(0,0,0,0.06)',
        md:  '0 2px 8px rgba(0,0,0,0.08)',
        lg:  '0 4px 16px rgba(0,0,0,0.12)',
        xl:  '0 8px 24px rgba(0,0,0,0.14)',
      },
      spacing: {
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Blueprint vsRise — the ONLY motion in the system
        'vs-rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Legacy aliases (used throughout existing pages)
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'badge-pop': {
          '0%':   { transform: 'scale(0.9)', opacity: '0' },
          '70%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'vs-rise':         'vs-rise 260ms ease-out both',
        'fade-in':         'vs-rise 260ms ease-out both',
        'scale-in':        'scale-in 200ms ease-out',
        'slide-in-right':  'slide-in-right 200ms ease-out',
        'badge-pop':       'badge-pop 300ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
