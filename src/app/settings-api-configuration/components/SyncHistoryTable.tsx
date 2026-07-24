'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RecordTypeBadge from '@/components/ui/RecordTypeBadge';

interface SyncLogEntry {
    id: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'TEST';
    recordType?: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
    recordName: string;
    status: 'success' | 'failed' | 'timeout' | 'partial';
    durationMs: number;
    timestamp: string;
    initiatedBy: string;
    errorDetail?: string;
    recordsAffected?: number;
}

const syncLogs: SyncLogEntry[] = [
    { id: 'log-001', operation: 'SYNC', recordName: 'Full sync — devoops.in', status: 'success', durationMs: 1842, timestamp: '2026-07-24 07:17', initiatedBy: 'Auto (5m)', recordsAffected: 14 },
    { id: 'log-002', operation: 'CREATE', recordType: 'A', recordName: 'grafana.devoops.in', status: 'success', durationMs: 312, timestamp: '2026-07-24 06:09', initiatedBy: 'Rahul Sharma' },
    { id: 'log-003', operation: 'UPDATE', recordType: 'CNAME', recordName: 'cdn.devoops.in', status: 'success', durationMs: 287, timestamp: '2026-07-24 01:44', initiatedBy: 'Priya Nair' },
    { id: 'log-004', operation: 'SYNC', recordName: 'Full sync — devoops.in', status: 'failed', durationMs: 5000, timestamp: '2026-07-23 22:12', initiatedBy: 'Auto (5m)', errorDetail: 'GoDaddy API returned 429 Too Many Requests — rate limit exceeded. Retry after 60s.' },
    { id: 'log-005', operation: 'DELETE', recordType: 'TXT', recordName: '@ (SPF old-provider)', status: 'success', durationMs: 198, timestamp: '2026-07-23 19:55', initiatedBy: 'Rahul Sharma' },
    { id: 'log-006', operation: 'CREATE', recordType: 'TXT', recordName: '_dmarc.devoops.in', status: 'partial', durationMs: 1100, timestamp: '2026-07-23 19:30', initiatedBy: 'Rahul Sharma', errorDetail: 'Record created in GoDaddy but propagation confirmation timed out after 120s. Record is live but status unconfirmed.' },
    { id: 'log-007', operation: 'TEST', recordName: 'API connection test', status: 'success', durationMs: 445, timestamp: '2026-07-23 15:08', initiatedBy: 'Ankit Verma' },
    { id: 'log-008', operation: 'SYNC', recordName: 'Full sync — devoops.in', status: 'success', durationMs: 1654, timestamp: '2026-07-23 12:00', initiatedBy: 'Auto (5m)', recordsAffected: 14 },
    { id: 'log-009', operation: 'UPDATE', recordType: 'MX', recordName: '@ (Priority 10)', status: 'timeout', durationMs: 5000, timestamp: '2026-07-22 18:44', initiatedBy: 'Priya Nair', errorDetail: 'GoDaddy API did not respond within 5000ms. The record may or may not have been updated — verify manually in GoDaddy dashboard.' },
    { id: 'log-010', operation: 'SYNC', recordName: 'Full sync — devoops.in', status: 'success', durationMs: 1799, timestamp: '2026-07-22 09:00', initiatedBy: 'Auto (5m)', recordsAffected: 13 },
];

const statusConfig = {
    success: { label: 'Success', Icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
    failed: { label: 'Failed', Icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    timeout: { label: 'Timeout', Icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    partial: { label: 'Partial', Icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
};

const opColors: Record<string, string> = {
    CREATE: 'text-accent bg-accent/10 border-accent/20',
    UPDATE: 'text-primary bg-primary/10 border-primary/20',
    DELETE: 'text-destructive bg-destructive/10 border-destructive/20',
    SYNC: 'text-muted-foreground bg-muted border-border',
    TEST: 'text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20',
};

export default function SyncHistoryTable() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [clearOpen, setClearOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const handleClearHistory = async () => {
        setIsClearing(true);
        // Backend integration point: DELETE /api/sync-history
        await new Promise((r) => setTimeout(r, 1000));
        setIsClearing(false);
        setClearOpen(false);
        toast.success('Sync history cleared');
    };

    return (
        <>
            <div className="card-elevated">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">GoDaddy Sync History</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Last {syncLogs.length} API operations — most recent first
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn-ghost text-xs px-2.5 py-1.5"
                            aria-label="Refresh sync history"
                        >
                            <RefreshCw size={13} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setClearOpen(true)}
                            className="btn-danger text-xs px-2.5 py-1.5"
                            aria-label="Clear sync history — this cannot be undone"
                        >
                            <Trash2 size={13} />
                            Clear History
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Operation</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Record / Target</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Status</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Duration</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Timestamp</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Initiated By</th>
                                <th className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 text-left">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {syncLogs.map((log, idx) => {
                                const sc = statusConfig[log.status];
                                const StatusIcon = sc.Icon;
                                const isExpanded = expandedRow === log.id;
                                const hasError = log.errorDetail || log.recordsAffected;

                                return (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className={`
                        border-b border-border transition-colors duration-100
                        hover:bg-muted/30
                        ${idx % 2 === 0 ? '' : 'bg-muted/10'}
                      `}
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-2xs font-bold font-mono px-2 py-0.5 rounded border ${opColors[log.operation]}`}
                                                >
                                                    {log.operation}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {log.recordType && <RecordTypeBadge type={log.recordType} />}
                                                    <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
                                                        {log.recordName}
                                                    </span>
                                                    {log.recordsAffected && (
                                                        <span className="text-2xs text-muted-foreground">
                                                            ({log.recordsAffected} records)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded border ${sc.bg} ${sc.color}`}>
                                                    <StatusIcon size={11} />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`font-mono text-xs tabular-nums ${log.durationMs >= 5000 ? 'text-destructive' : log.durationMs >= 2000 ? 'text-warning' : 'text-muted-foreground'}`}>
                                                    {log.durationMs >= 1000
                                                        ? `${(log.durationMs / 1000).toFixed(2)}s`
                                                        : `${log.durationMs}ms`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-muted-foreground">{log.timestamp}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-muted-foreground">{log.initiatedBy}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {hasError ? (
                                                    <button
                                                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                                        className="btn-ghost p-1 text-xs flex items-center gap-1"
                                                        aria-label={isExpanded ? 'Collapse detail' : 'Expand detail'}
                                                    >
                                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                        {isExpanded && log.errorDetail && (
                                            <tr key={`${log.id}-detail`} className="border-b border-border bg-muted/5">
                                                <td colSpan={7} className="px-4 py-3">
                                                    <div className={`flex items-start gap-2 p-3 rounded-md border text-xs ${log.status === 'success' ? 'bg-accent/5 border-accent/20 text-accent'
                                                            : log.status === 'failed' ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-warning/5 border-warning/20 text-warning'
                                                        }`}>
                                                        <StatusIcon size={13} className="flex-shrink-0 mt-0.5" />
                                                        <p className="font-mono leading-relaxed">{log.errorDetail}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing last {syncLogs.length} operations · History retained for 30 days
                    </p>
                    <p className="text-2xs text-muted-foreground font-mono">
                        Next auto-sync in <span className="text-foreground">04:22</span>
                    </p>
                </div>
            </div>

            <ConfirmModal
                isOpen={clearOpen}
                onClose={() => setClearOpen(false)}
                onConfirm={handleClearHistory}
                isLoading={isClearing}
                title="Clear sync history?"
                description="This will permanently delete all GoDaddy API operation logs. This action cannot be undone and may affect your ability to audit past DNS changes."
                confirmLabel="Clear All History"
            />
        </>
    );
}