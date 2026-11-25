// Tailwind via PostCSS: hot-reloads CSS edits reliably (the turbopack loader rule didn't).
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
