/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Wood palette (LOTO theme)
                wood: {
                    darkest: '#1a1109', // app background
                    darker: '#2d1f10',  // header / card background
                    dark: '#3d2814',    // wood medium
                    medium: '#5a4025',  // borders
                    light: '#8b6b4a',   // WARN: NOT safe for text on dark bg (3.2:1 — fails WCAG AA). Use only for backgrounds/borders.
                },
                cream: {
                    DEFAULT: '#f5e6c8',
                    light: '#fffaf0',
                    dark: '#e8d4b8',
                },
                gold: {
                    DEFAULT: '#ffd700',
                    dark: '#b8860b',
                },
                // Semantic
                success: '#4ade80',
                danger: '#ef4444',
                // Accessible muted text on dark backgrounds (WCAG AA — ~5:1 on #2d1f10)
                muted: '#d4b896',
                // Legacy aliases (kept for backwards compatibility — prefer the keys above)
                'wood-dark': '#2d1f10',
                'wood-light': '#3d2814',
                'gold-dark': '#b8860b',
            },
        },
    },
    plugins: [],
};
