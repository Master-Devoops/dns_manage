import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SslEntry {
    id: string;
    subdomain: string;
    issuer: string;
    daysLeft: number;
    expiresOn: string;
}

const sslEntries: SslEntry[] = [
    { id: 'ssl-api', subdomain: 'api', issuer: "Let's Encrypt", daysLeft: 6, expiresOn: 'Jul 30' },
    { id: 'ssl-mail', subdomain: 'mail', issuer: "Let's Encrypt", daysLeft: 6, expiresOn: 'Jul 30' },
    { id: 'ssl-staging', subdomain: 'staging', issuer: "Let's Encrypt", daysLeft: 18, expiresOn: 'Aug 11' },
    { id: 'ssl-docs', subdomain: 'docs', issuer: "Let's Encrypt", daysLeft: 24, expiresOn: 'Aug 17' },
    { id: 'ssl-app', subdomain: 'app', issuer: "Let's Encrypt", daysLeft: 47, expiresOn: 'Sep 09' },
    { id: 'ssl-cdn', subdomain: 'cdn', issuer: "Let's Encrypt", daysLeft: 62, expiresOn: 'Sep 24' },
    { id: 'ssl-www', subdomain: 'www', issuer: "Let's Encrypt", daysLeft: 74, expiresOn: 'Oct 06' },
    { id: 'ssl-status', subdomain: 'status', issuer: "ZeroSSL", daysLeft: 88, expiresOn: 'Oct 20' },
];

function getSslStatus(daysLeft: number) {
    if (daysLeft <= 7) return { label: 'Critical', Icon: ShieldX, color: 'text-destructive', bar: 'bg-destructive', width: Math.round((daysLeft / 90) * 100) };
    if (daysLeft <= 30) return { label: 'Expiring', Icon: ShieldAlert, color: 'text-warning', bar: 'bg-warning', width: Math.round((daysLeft / 90) * 100) };
    return { label: 'Valid', Icon: ShieldCheck, color: 'text-accent', bar: 'bg-accent', width: Math.round((daysLeft / 90) * 100) };
}

export default function SslExpiryPanel() {
    return (
        <div className="card-elevated p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">SSL Certificate Status</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">8 certificates tracked</p>
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-destructive bg-destructive/10 border border-destructive/20 px-2 py-1 rounded">
                    <ShieldX size={11} />
                    2 critical
                </div>
            </div>

            <div className="space-y-3">
                {sslEntries.map((entry) => {
                    const status = getSslStatus(entry.daysLeft);
                    const Icon = status.Icon;
                    return (
                        <div key={entry.id} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Icon size={12} className={status.color} />
                                    <span className="text-xs font-mono font-medium text-foreground truncate">
                                        {entry.subdomain}
                                        <span className="text-muted-foreground">.devoops.in</span>
                                    </span>
                                </div>
                                <span className={`text-2xs font-mono font-semibold ${status.color} tabular-nums flex-shrink-0 ml-2`}>
                                    {entry.daysLeft}d
                                </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                                    style={{ width: `${Math.min(status.width, 100)}%` }}
                                />
                            </div>
                            <p className="text-2xs text-muted-foreground mt-0.5">
                                {entry.issuer} · expires {entry.expiresOn}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}