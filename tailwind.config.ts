import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        bone: "#f5f5f0",
        ash: "#8a8a85",
        smoke: "#2a2a28",
        blood: "#c8102e",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-3px)" }, "75%": { transform: "translateX(3px)" } },
        flicker: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        rise: "rise 0.35s ease-out both",
        shake: "shake 0.25s ease-in-out 2",
        flicker: "flicker 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
