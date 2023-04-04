/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    plugins: [require("@tailwindcss/typography"), require("daisyui")],
}
