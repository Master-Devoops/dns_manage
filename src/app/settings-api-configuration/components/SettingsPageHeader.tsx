import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPageHeader() {
    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Settings size={18} className="text-primary" />
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    API Configuration
                </h1>
            </div>
            <p className="text-sm text-muted-foreground">
                GoDaddy API credentials, sync settings, and health monitoring configuration for{' '}
                <span className="font-mono text-foreground">devoops.in</span>
            </p>
        </div>
    );
}