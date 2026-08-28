/**
 * PostCSS wiring for Tailwind.
 *
 * Prompt 2a installed tailwindcss as a dependency but deliberately left it
 * unwired, because Appendix A gives the Tailwind configuration to Prompt 2b.
 * This file and tailwind.config.ts are that wiring.
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
