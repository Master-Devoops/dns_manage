/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
            padding: '1rem',
        },
        extend: {
            colors: {
                background: { DEFAULT: 'var(--background)' },
                foreground: { DEFAULT: 'var(--foreground)' },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                border: { DEFAULT: 'var(--border)' },
                input: { DEFAULT: 'var(--input)' },
                ring: { DEFAULT: 'var(--ring)' },
                destructive: {
                    DEFAULT: '#ef4444',
                    foreground: '#fafafa',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    foreground: '#09090b',
                },
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                sm: 'calc(var(--radius) - 2px)',
                md: 'var(--radius)',
                lg: 'calc(var(--radius) + 4px)',
                xl: 'calc(var(--radius) + 8px)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                '2xs': ['11px', { lineHeight: '16px' }],
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                shimmer: 'shimmer 2s linear infinite',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};