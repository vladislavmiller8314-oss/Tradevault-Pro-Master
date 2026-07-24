import type { Config } from "tailwindcss";

// Design tokens — derived directly from the TradeVault Pro brief.
// Instrument-panel aesthetic (TradingView precision + Porsche dashboard
// tactility + Bloomberg data density), rendered in a near-black cockpit.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: "#0F1117", // base background
          raised: "#161923",  // card / widget surface
          inset: "#0A0B10",   // recessed surfaces (inputs, gauges)
          line: "#242836",    // hairline borders / grid
        },
        gain: {
          DEFAULT: "#00C853",
          dim: "#0A3D24",
          glow: "#00C85333",
        },
        loss: {
          DEFAULT: "#D32F2F",
          dim: "#3D1414",
          glow: "#D32F2F33",
        },
        ink: {
          DEFAULT: "#E8EAF0", // primary text
          muted: "#8B93A7",   // secondary text
          faint: "#565D70",   // tertiary / disabled
        },
        accent: {
          amber: "#FFB020", // Evaluation/Prop account marker, warnings
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        instrument: "inset 0 1px 0 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.4)",
        dial: "inset 0 2px 6px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        panel: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
