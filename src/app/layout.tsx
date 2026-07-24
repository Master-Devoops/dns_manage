import React from 'react';
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import '../styles/tailwind.css';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    title: 'DevoopsPanel — Subdomain & DNS Control for devoops.in',
    description:
        'Manage subdomains, DNS records, and monitor SSL health for devoops.in. Syncs directly with GoDaddy API for real-time DNS control.',
    icons: {
        icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${GeistSans.variable} ${GeistMono.variable} dark`}
        >
            <body className={GeistSans.className}>
                {children}
                <Toaster
                    position="bottom-right"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                            fontFamily: 'var(--font-sans)',
                        },
                    }}
                />

                <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fdevoopspan9012back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.19" />
                <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></body>
        </html>
    );
}