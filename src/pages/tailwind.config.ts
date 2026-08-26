import type { Config } from 'tailwindcss';

// 1. Ubah require menjadi import gaya TypeScript di sini
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "inverse-surface": "#2b3234",
        "tertiary": "#006762",
        "surface-variant": "#dde4e6",
        "surface-container": "#e8eff1",
        "tertiary-fixed-dim": "#5dd9d0",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "surface": "#f4fafd",
        "on-tertiary-fixed": "#00201e",
        "surface-container-low": "#eef5f7",
        "on-primary-container": "#fdfcff",
        "on-background": "#161d1f",
        "on-tertiary-fixed-variant": "#00504c",
        "on-primary": "#ffffff",
        "secondary": "#83439e",
        "on-secondary-fixed": "#320047",
        "secondary-fixed-dim": "#ebb2ff",
        "surface-tint": "#0060ac",
        "outline-variant": "#c1c7d3",
        "primary-fixed": "#d4e3ff",
        "surface-container-high": "#e2e9ec",
        "error-container": "#ffdad6",
        "primary": "#005da7",
        "inverse-primary": "#a4c9ff",
        "error": "#ba1a1a",
        "on-surface-variant": "#414751",
        "primary-container": "#2976c7",
        "tertiary-container": "#00837c",
        "secondary-container": "#e29bfe",
        "surface-bright": "#f4fafd",
        "primary-fixed-dim": "#a4c9ff",
        "on-primary-fixed-variant": "#004883",
        "outline": "#717783",
        "on-secondary-container": "#692985",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#161d1f",
        "secondary-fixed": "#f8d8ff",
        "on-tertiary-container": "#f3fffd",
        "surface-dim": "#d4dbdd",
        "tertiary-fixed": "#7cf6ec",
        "on-error-container": "#93000a",
        "background": "#f4fafd",
        "inverse-on-surface": "#ebf2f4",
        "on-primary-fixed": "#001c39",
        "on-error": "#ffffff",
        "surface-container-highest": "#dde4e6",
        "on-secondary-fixed-variant": "#692984"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        xl: "32px",
        base: "8px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        gutter: "12px",
        "container-margin": "20px",
        xs: "4px"
      },
      fontFamily: {
        "label-bold": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "caption": ["Plus Jakarta Sans", "sans-serif"],
        "section-title": ["Plus Jakarta Sans", "sans-serif"],
        "body-main": ["Plus Jakarta Sans", "sans-serif"],
        "screen-title": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "label-bold": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "caption": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "section-title": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-main": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "screen-title": ["24px", { lineHeight: "32px", fontWeight: "700" }]
      }
    },
  },
  plugins: [
    // 2. Gunakan variabel yang sudah di-import di atas
    containerQueries,
    forms
  ],
};

export default config;