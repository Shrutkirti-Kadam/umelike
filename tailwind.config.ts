import type { Config } from "tailwindcss";

/**
 * umelike palette — "golden hour, not bubblegum".
 * Named colors keep the interface warm and consistent.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF6EE",   // page background — warm, not stark white
        blush: "#F3E6DD",   // card / surface tint
        berry: "#A2596B",   // primary accent — dusty rose, muted berry
        "berry-deep": "#8A4A5B", // hover / pressed berry
        gold: "#D9A05B",    // soft warm gold — highlights only
        plum: "#322230",    // text — warm near-black
        mauve: "#6E5A66",   // secondary text
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        soft: "1.25rem",  // cards
        field: "0.9rem",  // inputs
      },
    },
  },
  plugins: [],
};
export default config;
