/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1B33',
          light: '#132A4D',
          soft: '#1E3A66',
        },
        sky: {
          DEFAULT: '#2E6FE8',
          dark: '#1E52B8',
          light: '#E8F0FE',
        },
        sunrise: {
          DEFAULT: '#F5A623',
          dark: '#D9890C',
        },
        mist: '#F7F9FC',
        ink: '#101828',
        slate: {
          DEFAULT: '#475467',
          light: '#98A2B3',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'flight-path': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20'%3E%3Cline x1='0' y1='10' x2='100' y2='10' stroke='%232E6FE8' stroke-width='2' stroke-dasharray='6,6'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(11,27,51,0.15)',
        ticket: '0 20px 40px -12px rgba(11,27,51,0.25)',
      },
    },
  },
  plugins: [],
}
