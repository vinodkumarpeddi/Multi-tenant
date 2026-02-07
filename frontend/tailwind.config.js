/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
            },
            animation: {
                blob: "blob 7s infinite",
                shake: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
            },
            keyframes: {
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
                shake: {
                    "10%, 90%": {
                        transform: "translate3d(-1px, 0, 0)",
                    },
                    "20%, 80%": {
                        transform: "translate3d(2px, 0, 0)",
                    },
                    "30%, 50%, 70%": {
                        transform: "translate3d(-4px, 0, 0)",
                    },
                    "40%, 60%": {
                        transform: "translate3d(4px, 0, 0)",
                    },
                },
            },
        },
    },
    plugins: [],
}
