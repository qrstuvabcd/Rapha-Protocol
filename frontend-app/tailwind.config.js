/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                rapha: {
                    obsidian: '#050505',
                    'obsidian-light': '#0F0F0F',
                    pearl: '#E2E8F0',
                    'pearl-muted': '#94A3B8',
                    silver: '#E5E7EB',
                    'silver-dark': '#9CA3AF',
                },
                aura: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#06b6d4',
                    dark: '#0f172a',
                    card: '#1e293b',
                }
            },
            backgroundImage: {
                'stealth-gradient': 'linear-gradient(135deg, #050505 0%, #0F0F0F 100%)',
                'pearl-gradient': 'linear-gradient(135deg, rgba(226, 232, 240, 0.8) 0%, rgba(226, 232, 240, 0.4) 50%, rgba(148, 163, 184, 0.2) 100%)',
            }
        },
    },
    plugins: [],
}
