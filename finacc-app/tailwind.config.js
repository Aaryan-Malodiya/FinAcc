/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'selector',
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
        ink: {
          DEFAULT: '#12181F',
          base: '#12181F',
          panel: '#1B232D',
          border: '#29333F',
          soft: '#8A97A6',
        },
        paper: {
          DEFAULT: '#EDE7DA',
          light: '#F6F2E8',
          border: '#E1D8C4',
          ink: '#2B261E',
          muted: '#6E6656',
        },
        brass: {
          DEFAULT: '#E8A33D',
          dark: '#C8842A',
          tint: '#FBEBD1',
        },
        clean: {
          DEFAULT: '#5C7A6E',
          bg: '#E4EAE4',
        },
        watch: {
          DEFAULT: '#C8842A',
          bg: '#F3E4C8',
        },
        risk: {
          DEFAULT: '#B84C3E',
          bg: '#F5E1DD',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
