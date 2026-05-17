/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        background: "oklch(0.16 0.015 280)",
        foreground: "oklch(0.97 0.005 280)",
        card: "oklch(0.20 0.018 280)",
        "card-foreground": "oklch(0.97 0.005 280)",
        popover: "oklch(0.20 0.018 280)",
        "popover-foreground": "oklch(0.97 0.005 280)",
        primary: "oklch(0.75 0.18 295)",
        "primary-foreground": "oklch(0.15 0.02 280)",
        secondary: "oklch(0.25 0.02 280)",
        "secondary-foreground": "oklch(0.97 0.005 280)",
        muted: "oklch(0.24 0.018 280)",
        "muted-foreground": "oklch(0.49 0.02 280)",
        accent: "oklch(0.75 0.18 295)",
        "accent-foreground": "oklch(0.15 0.02 280)",
        destructive: "oklch(0.63 0.23 27)",
        "destructive-foreground": "oklch(0.97 0.005 280)",
        border: "oklch(0.20 0.010 280)",
        input: "oklch(0.20 0.010 280)",
        ring: "oklch(0.75 0.18 295)",
        success: "oklch(0.69 0.21 142)",
        "code-bg": "#0f0f1a",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
};
