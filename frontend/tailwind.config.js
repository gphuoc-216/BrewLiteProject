/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
        },
        'on-accent': 'var(--on-accent)',
        espresso: {
          DEFAULT: 'var(--espresso)',
          text: 'var(--espresso-text)',
          muted: 'var(--espresso-muted)',
          line: 'var(--espresso-line)',
          deep: 'var(--espresso-deep)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-bg)',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'var(--font-display)', 'Lora', 'Georgia', 'serif'],
        body: ['var(--font-be-vietnam-pro)', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
      },
      boxShadow: {
        float: '0 8px 24px rgba(38,30,24,0.12)',
        none: 'none',
      },
    },
  },
  plugins: [],
};
