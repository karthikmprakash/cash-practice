import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        "border-input": "var(--border-input)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "on-accent": "var(--on-accent)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
};

export default config;
