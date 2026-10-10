import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fbf6ef',
        sage: '#dce0d9',
        tan: '#ead7c3',
        nails: '#2c1820',
        cookie: '#3a2218',
        ok: '#3a7a3a',
        bad: '#b3392c',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        serif: ['var(--font-serif)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
