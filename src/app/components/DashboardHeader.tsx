'use client';

import React, { useState } from 'react';
import { RefreshCw, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardHeader() {
    const [syncing, setSyncing] = useState(false);
    const [lastSync] = useState('2 min ago');

    const handleSync = async () => {
        setSyncing(true);
        // Backend integration point: POST /api/godaddy/sync
        await new Promise((r) => setTimeout(r, 2200));
        setSyncing(false);
        toast?.success('GoDaddy sync complete — 14 records refreshed', {
            description: 'All DNS records are up to date with devoops.in',
        });
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                        Subdomain Dashboard
                    </h1>
                    <span className="px-2 py-0.5 text-2xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20 rounded">
                        devoops.in
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Clock size={11} />
                        Last GoDaddy sync: <strong className="text-foreground">{lastSync}</strong>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full status-dot-active" />
                        GoDaddy API connected
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-secondary text-sm"
                    aria-label="Sync with GoDaddy"
                >
                    <RefreshCw
                        size={14}
                        className={syncing ? 'animate-spin' : ''}
                    />
                    {syncing ? 'Syncing...' : 'Sync GoDaddy'}
                </button>

                <button className="btn-primary text-sm">
                    <Plus size={14} />
                    New Subdomain
                </button>
            </div>
        </div>
    );
}