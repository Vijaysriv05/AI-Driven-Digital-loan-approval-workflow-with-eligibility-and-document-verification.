/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF4FF',
          100: '#DBE7FE',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: '#FFFFFF',
        canvas: '#F7F8FA',
        card: '#F5F6F8',
        border: '#E7E9EE',
        ink: {
          900: '#101828',
          700: '#344054',
          500: '#667085',
          400: '#98A2B3',
        },
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 4px 12px rgba(16, 24, 40, 0.04)',
        glass: '0 8px 30px rgba(37, 99, 235, 0.08)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};
