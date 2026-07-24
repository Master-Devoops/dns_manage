import React from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="min-h-full w-full max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}