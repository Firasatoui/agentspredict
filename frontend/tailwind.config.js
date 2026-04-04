export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { gold: '#f59e0b', navy: '#0f172a' },
        neon: { cyan: '#22d3ee', purple: '#a78bfa', gold: '#fbbf24' },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(34, 211, 238, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.025) 1px, transparent 1px)`,
      },
      backgroundSize: { 'grid': '48px 48px' },
    }
  },
  plugins: []
}
