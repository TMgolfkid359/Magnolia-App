/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f5',
          100: '#dcf2e6',
          200: '#bce5cd',
          300: '#8fd1ab',
          400: '#5ab583',
          500: '#369966',
          600: '#287a52',
          700: '#226244',
          800: '#1f4f38',
          900: '#1a4230',
        },
        magnolia: {
          50: '#f0f9f5',
          100: '#dcf2e6',
          200: '#bce5cd',
          300: '#8fd1ab',
          400: '#5ab583',
          500: '#369966',
          600: '#287a52',
          700: '#226244',
          800: '#1a5f3f',
          900: '#154a32',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

