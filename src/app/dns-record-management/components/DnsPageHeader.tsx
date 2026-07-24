import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';

export default function DnsPageHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Globe size={18} className="text-primary" />
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                        DNS Record Management
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    All DNS records for{' '}
                    <span className="font-mono text-foreground">devoops.in</span> — synced
                    via GoDaddy API
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5">
                    <RefreshCw size={11} className="text-primary" />
                    Last sync: <span className="text-foreground font-mono ml-1">2 min ago</span>
                </div>
            </div>
        </div>
    );
}