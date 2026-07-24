'use client';

import React, { useState } from 'react';
import {
    ChevronUp,
    ChevronDown,
    ExternalLink,
    Edit2,
    Trash2,
    RefreshCw,
    Search,
    Filter,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

interface SubdomainRow {
    id: string;
    name: string;
    target: string;
    type: string;
    status: 'active' | 'degraded' | 'down' | 'unknown';
    sslDays: number;
    httpStatus: number;
    responseMs: number;
    uptime30d: number;
    lastChecked: string;
    dnsRecords: number;
}

const subdomains: SubdomainRow[] = [
    { id: 'sub-api', name: 'api', target: '165.22.214.88', type: 'A', status: 'down', sslDays: 6, httpStatus: 502, responseMs: 0, uptime30d: 94.2, lastChecked: '1m ago', dnsRecords: 3 },
    { id: 'sub-app', name: 'app', target: '165.22.214.88', type: 'A', status: 'active', sslDays: 47, httpStatus: 200, responseMs: 142, uptime30d: 99.7, lastChecked: '1m ago', dnsRecords: 2 },
    { id: 'sub-cdn', name: 'cdn', target: 'cdn.cloudflare.net', type: 'CNAME', status: 'degraded', sslDays: 62, httpStatus: 200, responseMs: 891, uptime30d: 97.1, lastChecked: '2m ago', dnsRecords: 1 },
    { id: 'sub-docs', name: 'docs', target: 'devoops.github.io', type: 'CNAME', status: 'active', sslDays: 24, httpStatus: 200, responseMs: 234, uptime30d: 99.9, lastChecked: '1m ago', dnsRecords: 1 },
    { id: 'sub-mail', name: 'mail', target: '165.22.214.90', type: 'A', status: 'active', sslDays: 6, httpStatus: 200, responseMs: 88, uptime30d: 99.5, lastChecked: '1m ago', dnsRecords: 4 },
    { id: 'sub-staging', name: 'staging', target: '165.22.214.91', type: 'A', status: 'active', sslDays: 18, httpStatus: 200, responseMs: 310, uptime30d: 98.2, lastChecked: '3m ago', dnsRecords: 2 },
    { id: 'sub-status', name: 'status', target: 'statuspage.io', type: 'CNAME', status: 'active', sslDays: 88, httpStatus: 200, responseMs: 178, uptime30d: 100.0, lastChecked: '1m ago', dnsRecords: 1 },
    { id: 'sub-www', name: 'www', target: '165.22.214.88', type: 'A', status: 'active', sslDays: 74, httpStatus: 200, responseMs: 95, uptime30d: 99.8, lastChecked: '1m ago', dnsRecords: 2 },
    { id: 'sub-dev', name: 'dev', target: '165.22.214.92', type: 'A', status: 'active', sslDays: 41, httpStatus: 200, responseMs: 205, uptime30d: 97.8, lastChecked: '2m ago', dnsRecords: 2 },
    { id: 'sub-auth', name: 'auth', target: '165.22.214.88', type: 'A', status: 'active', sslDays: 55, httpStatus: 200, responseMs: 119, uptime30d: 99.6, lastChecked: '1m ago', dnsRecords: 3 },
    { id: 'sub-ws', name: 'ws', target: '165.22.214.93', type: 'A', status: 'active', sslDays: 33, httpStatus: 101, responseMs: 45, uptime30d: 99.1, lastChecked: '1m ago', dnsRecords: 1 },
    { id: 'sub-grafana', name: 'grafana', target: '165.22.214.94', type: 'A', status: 'active', sslDays: 29, httpStatus: 200, responseMs: 287, uptime30d: 98.9, lastChecked: '2m ago', dnsRecords: 1 },
];

type SortKey = keyof SubdomainRow;

export default function SubdomainHealthTable() {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('status');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = subdomains
        .filter((s) =>
            s.name.includes(search.toLowerCase()) ||
            s.target.includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av;
            }
            return sortDir === 'asc'
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        setDeletingId(id);
        // Backend integration point: DELETE /api/subdomains/:id
        await new Promise((r) => setTimeout(r, 1200));
        setDeletingId(null);
        toast.success(`Subdomain ${name}.devoops.in removed`);
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col)
            return <ChevronUp size={11} className="opacity-20" />;
        return sortDir === 'asc' ? (
            <ChevronUp size={11} className="text-primary" />
        ) : (
            <ChevronDown size={11} className="text-primary" />
        );
    };

    const thClass =
        'text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-3 text-left select-none whitespace-nowrap cursor-pointer hover:text-foreground transition-colors';
    const tdClass = 'px-3 py-3 text-sm align-middle';

    const getSslColor = (days: number) => {
        if (days <= 7) return 'text-destructive font-semibold';
        if (days <= 30) return 'text-warning font-semibold';
        return 'text-muted-foreground';
    };

    const getHttpStatusColor = (code: number) => {
        if (code >= 500 || code === 0) return 'text-destructive';
        if (code >= 400) return 'text-warning';
        return 'text-accent';
    };

    const getResponseColor = (ms: number) => {
        if (ms === 0) return 'text-destructive';
        if (ms > 500) return 'text-warning';
        return 'text-foreground';
    };

    return (
        <div className="card-elevated">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Subdomain Health</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {filtered.length} of {subdomains.length} subdomains
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            placeholder="Search subdomains..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-base pl-8 h-8 text-xs w-48"
                        />
                    </div>
                    <button className="btn-ghost h-8 px-2.5 text-xs">
                        <Filter size={13} />
                        Filter
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className={thClass} onClick={() => handleSort('name')}>
                                <span className="flex items-center gap-1">Subdomain <SortIcon col="name" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('status')}>
                                <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('target')}>
                                <span className="flex items-center gap-1">Target / IP <SortIcon col="target" /></span>
                            </th>
                            <th className={thClass}>Type</th>
                            <th className={thClass} onClick={() => handleSort('httpStatus')}>
                                <span className="flex items-center gap-1">HTTP <SortIcon col="httpStatus" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('responseMs')}>
                                <span className="flex items-center gap-1">Response <SortIcon col="responseMs" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('sslDays')}>
                                <span className="flex items-center gap-1">SSL Exp. <SortIcon col="sslDays" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('uptime30d')}>
                                <span className="flex items-center gap-1">Uptime 30d <SortIcon col="uptime30d" /></span>
                            </th>
                            <th className={thClass}>DNS Rec.</th>
                            <th className={thClass}>Last Check</th>
                            <th className={`${thClass} text-right`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, idx) => (
                            <tr
                                key={row.id}
                                className={`
                  border-b border-border transition-colors duration-100 group
                  hover:bg-muted/40
                  ${idx % 2 === 0 ? '' : 'bg-muted/10'}
                  ${deletingId === row.id ? 'opacity-40 pointer-events-none' : ''}
                `}
                            >
                                <td className={tdClass}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs font-semibold text-foreground">
                                            {row.name}
                                        </span>
                                        <span className="font-mono text-2xs text-muted-foreground">.devoops.in</span>
                                    </div>
                                </td>
                                <td className={tdClass}>
                                    <StatusBadge variant={row.status} />
                                </td>
                                <td className={tdClass}>
                                    <span className="font-mono text-xs text-foreground">{row.target}</span>
                                </td>
                                <td className={tdClass}>
                                    <span className="font-mono text-2xs font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                                        {row.type}
                                    </span>
                                </td>
                                <td className={tdClass}>
                                    <span className={`font-mono text-xs tabular-nums ${getHttpStatusColor(row.httpStatus)}`}>
                                        {row.httpStatus === 0 ? '—' : row.httpStatus}
                                    </span>
                                </td>
                                <td className={tdClass}>
                                    <span className={`font-mono text-xs tabular-nums ${getResponseColor(row.responseMs)}`}>
                                        {row.responseMs === 0 ? 'timeout' : `${row.responseMs}ms`}
                                    </span>
                                </td>
                                <td className={tdClass}>
                                    <span className={`font-mono text-xs tabular-nums ${getSslColor(row.sslDays)}`}>
                                        {row.sslDays}d
                                    </span>
                                </td>
                                <td className={tdClass}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${row.uptime30d >= 99 ? 'bg-accent' : row.uptime30d >= 95 ? 'bg-warning' : 'bg-destructive'}`}
                                                style={{ width: `${row.uptime30d}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs tabular-nums text-foreground">
                                            {row.uptime30d}%
                                        </span>
                                    </div>
                                </td>
                                <td className={tdClass}>
                                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                        {row.dnsRecords}
                                    </span>
                                </td>
                                <td className={tdClass}>
                                    <span className="text-xs text-muted-foreground">{row.lastChecked}</span>
                                </td>
                                <td className={`${tdClass} text-right`}>
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="btn-ghost p-1.5"
                                            title={`Refresh health check for ${row.name}.devoops.in`}
                                            aria-label="Refresh health check"
                                        >
                                            <RefreshCw size={13} />
                                        </button>
                                        <a
                                            href={`https://${row.name}.devoops.in`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ghost p-1.5"
                                            title={`Open ${row.name}.devoops.in in new tab`}
                                            aria-label="Open subdomain"
                                        >
                                            <ExternalLink size={13} />
                                        </a>
                                        <button
                                            className="btn-ghost p-1.5"
                                            title={`Edit ${row.name}.devoops.in subdomain`}
                                            aria-label="Edit subdomain"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(row.id, row.name)}
                                            className="btn-ghost p-1.5 hover:text-destructive"
                                            title={`Delete ${row.name}.devoops.in — this cannot be undone`}
                                            aria-label="Delete subdomain"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} subdomains · auto-refresh every 60s
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw size={11} />
                    Next check in <span className="text-foreground font-mono tabular-nums">00:47</span>
                </div>
            </div>
        </div>
    );
}