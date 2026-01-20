/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                'wood-dark': '#2d1f10',
                'wood-light': '#3d2814',
                'gold': '#ffd700',
                'gold-dark': '#b8860b',
            },
        },
    },
    plugins: [],
};
