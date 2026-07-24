'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    Plus,
    ChevronUp,
    ChevronDown,
    Edit2,
    Trash2,
    Copy,
    CheckCheck,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import RecordTypeBadge from '@/components/ui/RecordTypeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import DnsRecordFormModal from './DnsRecordFormModal';
import { toast } from 'sonner';

interface DnsRecord {
    id: string;
    type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'AAAA';
    name: string;
    value: string;
    ttl: number;
    priority?: number;
    propagation: 'live' | 'propagating' | 'pending' | 'stale';
    synced: boolean;
    lastUpdated: string;
    updatedBy: string;
}

const initialRecords: DnsRecord[] = [
    { id: 'rec-001', type: 'A', name: '@', value: '165.22.214.88', ttl: 600, propagation: 'live', synced: true, lastUpdated: '3h ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-002', type: 'A', name: 'www', value: '165.22.214.88', ttl: 600, propagation: 'live', synced: true, lastUpdated: '3h ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-003', type: 'A', name: 'app', value: '165.22.214.88', ttl: 300, propagation: 'live', synced: true, lastUpdated: '1d ago', updatedBy: 'Priya Nair' },
    { id: 'rec-004', type: 'A', name: 'api', value: '165.22.214.88', ttl: 300, propagation: 'live', synced: true, lastUpdated: '2d ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-005', type: 'A', name: 'mail', value: '165.22.214.90', ttl: 3600, propagation: 'live', synced: true, lastUpdated: '5d ago', updatedBy: 'Priya Nair' },
    { id: 'rec-006', type: 'A', name: 'staging', value: '165.22.214.91', ttl: 300, propagation: 'live', synced: true, lastUpdated: '2d ago', updatedBy: 'Ankit Verma' },
    { id: 'rec-007', type: 'A', name: 'dev', value: '165.22.214.92', ttl: 300, propagation: 'live', synced: true, lastUpdated: '4d ago', updatedBy: 'Ankit Verma' },
    { id: 'rec-008', type: 'A', name: 'grafana', value: '165.22.214.94', ttl: 300, propagation: 'propagating', synced: false, lastUpdated: '1h ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-009', type: 'A', name: 'auth', value: '165.22.214.88', ttl: 600, propagation: 'live', synced: true, lastUpdated: '6d ago', updatedBy: 'Priya Nair' },
    { id: 'rec-010', type: 'CNAME', name: 'cdn', value: 'cdn.cloudflare.net', ttl: 300, propagation: 'propagating', synced: false, lastUpdated: '5h ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-011', type: 'CNAME', name: 'docs', value: 'devoops.github.io', ttl: 300, propagation: 'live', synced: true, lastUpdated: '1d ago', updatedBy: 'Ankit Verma' },
    { id: 'rec-012', type: 'CNAME', name: 'status', value: 'statuspage.io', ttl: 300, propagation: 'live', synced: true, lastUpdated: '3d ago', updatedBy: 'Priya Nair' },
    { id: 'rec-013', type: 'MX', name: '@', value: 'mail.devoops.in', ttl: 3600, priority: 10, propagation: 'live', synced: true, lastUpdated: '7d ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-014', type: 'MX', name: '@', value: 'alt1.aspmx.l.google.com', ttl: 3600, priority: 20, propagation: 'live', synced: true, lastUpdated: '7d ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-015', type: 'TXT', name: '@', value: 'v=spf1 include:sendgrid.net include:_spf.google.com ~all', ttl: 3600, propagation: 'live', synced: true, lastUpdated: '10d ago', updatedBy: 'Priya Nair' },
    { id: 'rec-016', type: 'TXT', name: '@', value: 'google-site-verification=dV2_kzGv8qX3mNpY7tRwLs9', ttl: 3600, propagation: 'live', synced: true, lastUpdated: '14d ago', updatedBy: 'Ankit Verma' },
    { id: 'rec-017', type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@devoops.in', ttl: 3600, propagation: 'pending', synced: false, lastUpdated: '30m ago', updatedBy: 'Rahul Sharma' },
    { id: 'rec-018', type: 'NS', name: '@', value: 'ns73.domaincontrol.com', ttl: 3600, propagation: 'live', synced: true, lastUpdated: '90d ago', updatedBy: 'GoDaddy' },
    { id: 'rec-019', type: 'NS', name: '@', value: 'ns74.domaincontrol.com', ttl: 3600, propagation: 'live', synced: true, lastUpdated: '90d ago', updatedBy: 'GoDaddy' },
    { id: 'rec-020', type: 'SRV', name: '_sip._tcp', value: '0 5060 sip.devoops.in', ttl: 300, priority: 10, propagation: 'live', synced: true, lastUpdated: '21d ago', updatedBy: 'Ankit Verma' },
];

const recordTypes = ['All', 'A', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'AAAA'] as const;
type FilterType = (typeof recordTypes)[number];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function DnsRecordTable() {
    const [records, setRecords] = useState<DnsRecord[]>(initialRecords);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<FilterType>('All');
    const [sortKey, setSortKey] = useState<keyof DnsRecord>('type');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<DnsRecord | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return records
            .filter((r) => {
                const matchType = typeFilter === 'All' || r.type === typeFilter;
                const q = search.toLowerCase();
                const matchSearch =
                    !q ||
                    r.name.toLowerCase().includes(q) ||
                    r.value.toLowerCase().includes(q) ||
                    r.type.toLowerCase().includes(q);
                return matchType && matchSearch;
            })
            .sort((a, b) => {
                const av = a[sortKey];
                const bv = b[sortKey];
                if (typeof av === 'number' && typeof bv === 'number') {
                    return sortDir === 'asc' ? av - bv : bv - av;
                }
                return sortDir === 'asc' ? String(av ?? '').localeCompare(String(bv ?? ''))
                    : String(bv ?? '').localeCompare(String(av ?? ''));
            });
    }, [records, search, typeFilter, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: keyof DnsRecord) => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === paginated.length) setSelected(new Set());
        else setSelected(new Set(paginated.map((r) => r.id)));
    };

    const handleCopy = (id: string, value: string) => {
        navigator.clipboard.writeText(value).catch(() => { });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        // Backend integration point: DELETE /api/dns-records/:id
        await new Promise((r) => setTimeout(r, 1000));
        setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setIsDeleting(false);
        setDeleteTarget(null);
        toast.success(`DNS record deleted`, {
            description: `${deleteTarget.type} record for ${deleteTarget.name} removed from GoDaddy`,
        });
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        // Backend integration point: DELETE /api/dns-records/bulk
        await new Promise((r) => setTimeout(r, 1400));
        setRecords((prev) => prev.filter((r) => !selected.has(r.id)));
        const count = selected.size;
        setSelected(new Set());
        setIsDeleting(false);
        setBulkDeleteOpen(false);
        toast.success(`${count} DNS records deleted`);
    };

    const handleFormSave = (data: Partial<DnsRecord>) => {
        if (editRecord) {
            // Backend integration point: PUT /api/dns-records/:id
            setRecords((prev) =>
                prev.map((r) => (r.id === editRecord.id ? { ...r, ...data, propagation: 'propagating', synced: false } : r))
            );
            toast.success('DNS record updated — propagating to GoDaddy');
        } else {
            // Backend integration point: POST /api/dns-records
            const newRec: DnsRecord = {
                id: `rec-${Date.now()}`,
                type: 'A',
                name: '',
                value: '',
                ttl: 300,
                propagation: 'pending',
                synced: false,
                lastUpdated: 'just now',
                updatedBy: 'You',
                ...data,
            } as DnsRecord;
            setRecords((prev) => [newRec, ...prev]);
            toast.success('DNS record created — queued for GoDaddy sync');
        }
        setIsFormOpen(false);
        setEditRecord(null);
    };

    const SortIcon = ({ col }: { col: keyof DnsRecord }) => {
        if (sortKey !== col) return <ChevronUp size={10} className="opacity-20" />;
        return sortDir === 'asc' ? (
            <ChevronUp size={10} className="text-primary" />
        ) : (
            <ChevronDown size={10} className="text-primary" />
        );
    };

    const thClass =
        'text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-3 text-left cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors';

    return (
        <>
            <div className="card-elevated">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                        {recordTypes.map((t) => (
                            <button
                                key={`filter-${t}`}
                                onClick={() => { setTypeFilter(t); setPage(1); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${typeFilter === t
                                        ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-transparent hover:text-foreground hover:border-border'
                                    }`}
                            >
                                {t}
                                {t !== 'All' && (
                                    <span className="ml-1.5 text-2xs opacity-60">
                                        {records.filter((r) => r.type === t).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="input-base pl-8 h-8 text-xs w-44"
                            />
                        </div>
                        <button
                            onClick={() => { setEditRecord(null); setIsFormOpen(true); }}
                            className="btn-primary text-xs h-8 px-3"
                        >
                            <Plus size={13} />
                            Add Record
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-3 py-3 w-8">
                                    <input
                                        type="checkbox"
                                        checked={selected.size > 0 && selected.size === paginated.length}
                                        onChange={toggleAll}
                                        className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                                        aria-label="Select all records"
                                    />
                                </th>
                                <th className={thClass} onClick={() => handleSort('type')}>
                                    <span className="flex items-center gap-1">Type <SortIcon col="type" /></span>
                                </th>
                                <th className={thClass} onClick={() => handleSort('name')}>
                                    <span className="flex items-center gap-1">Name <SortIcon col="name" /></span>
                                </th>
                                <th className={thClass} onClick={() => handleSort('value')}>
                                    <span className="flex items-center gap-1">Value / Target <SortIcon col="value" /></span>
                                </th>
                                <th className={thClass} onClick={() => handleSort('ttl')}>
                                    <span className="flex items-center gap-1">TTL <SortIcon col="ttl" /></span>
                                </th>
                                <th className={thClass} onClick={() => handleSort('priority')}>
                                    <span className="flex items-center gap-1">Priority <SortIcon col="priority" /></span>
                                </th>
                                <th className={thClass} onClick={() => handleSort('propagation')}>
                                    <span className="flex items-center gap-1">Propagation <SortIcon col="propagation" /></span>
                                </th>
                                <th className={thClass}>GoDaddy Sync</th>
                                <th className={thClass} onClick={() => handleSort('lastUpdated')}>
                                    <span className="flex items-center gap-1">Updated <SortIcon col="lastUpdated" /></span>
                                </th>
                                <th className={thClass}>By</th>
                                <th className={`${thClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Globe size={32} className="text-muted-foreground opacity-40" />
                                            <p className="text-sm font-semibold text-foreground">No DNS records found</p>
                                            <p className="text-xs text-muted-foreground max-w-xs">
                                                No records match your current filter. Try changing the record type or clearing the search.
                                            </p>
                                            <button
                                                onClick={() => { setTypeFilter('All'); setSearch(''); }}
                                                className="btn-secondary text-xs mt-1"
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((rec, idx) => (
                                    <tr
                                        key={rec.id}
                                        className={`
                      border-b border-border transition-colors duration-100 group
                      hover:bg-muted/40
                      ${idx % 2 === 0 ? '' : 'bg-muted/10'}
                      ${selected.has(rec.id) ? 'bg-primary/5' : ''}
                    `}
                                    >
                                        <td className="px-3 py-3 w-8">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(rec.id)}
                                                onChange={() => toggleSelect(rec.id)}
                                                className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                                                aria-label={`Select ${rec.type} record for ${rec.name}`}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <RecordTypeBadge type={rec.type} />
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="font-mono text-xs font-semibold text-foreground">
                                                {rec.name === '@' ? (
                                                    <span className="text-primary">@</span>
                                                ) : (
                                                    <>
                                                        {rec.name}
                                                        <span className="text-muted-foreground">.devoops.in</span>
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 max-w-[240px]">
                                            <div className="flex items-center gap-1.5 group/copy">
                                                <span className="font-mono text-xs text-foreground truncate block max-w-[200px]" title={rec.value}>
                                                    {rec.value}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(rec.id, rec.value)}
                                                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity btn-ghost p-0.5"
                                                    title="Copy value to clipboard"
                                                    aria-label="Copy DNS record value"
                                                >
                                                    {copiedId === rec.id ? (
                                                        <CheckCheck size={11} className="text-accent" />
                                                    ) : (
                                                        <Copy size={11} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                                {rec.ttl}s
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {rec.priority !== undefined ? (
                                                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                                    {rec.priority}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge variant={rec.propagation} />
                                        </td>
                                        <td className="px-3 py-3">
                                            {rec.synced ? (
                                                <span className="flex items-center gap-1 text-2xs text-accent">
                                                    <CheckCheck size={11} />
                                                    Synced
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-2xs text-warning">
                                                    <RefreshCw size={11} className="animate-spin" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-muted-foreground">{rec.lastUpdated}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-muted-foreground truncate max-w-[80px] block">{rec.updatedBy}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditRecord(rec); setIsFormOpen(true); }}
                                                    className="btn-ghost p-1.5"
                                                    title={`Edit ${rec.type} record for ${rec.name} — update value, TTL, or priority`}
                                                    aria-label="Edit record"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(rec)}
                                                    className="btn-ghost p-1.5 hover:text-destructive"
                                                    title={`Delete this ${rec.type} record — this cannot be undone`}
                                                    aria-label="Delete record"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                            {filtered.length} records total
                        </span>
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs text-muted-foreground">Rows:</label>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="input-base h-7 text-xs w-16 py-0 px-2"
                            >
                                {PAGE_SIZE_OPTIONS.map((s) => (
                                    <option key={`page-size-${s}`} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-ghost p-1.5 disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={`page-btn-${i + 1}`}
                                onClick={() => setPage(i + 1)}
                                className={`w-7 h-7 text-xs font-semibold rounded transition-all ${page === i + 1
                                        ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-ghost p-1.5 disabled:opacity-40"
                            aria-label="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 slide-up">
                    <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl">
                        <span className="text-sm font-semibold text-foreground">
                            {selected.size} record{selected.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="w-px h-4 bg-border" />
                        <button
                            onClick={() => setSelected(new Set())}
                            className="btn-ghost text-xs"
                        >
                            Deselect all
                        </button>
                        <button
                            onClick={() => setBulkDeleteOpen(true)}
                            className="btn-danger text-xs"
                        >
                            <Trash2 size={13} />
                            Delete {selected.size} record{selected.size > 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title={`Delete ${deleteTarget?.type} record?`}
                description={`This will permanently remove the ${deleteTarget?.type} record for "${deleteTarget?.name}" from GoDaddy. DNS propagation may take up to 48 hours to fully clear.`}
                confirmLabel="Delete Record"
            />

            {/* Bulk delete confirm */}
            <ConfirmModal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                isLoading={isDeleting}
                title={`Delete ${selected.size} DNS records?`}
                description={`This will permanently remove ${selected.size} records from GoDaddy. This action cannot be undone and will affect live DNS resolution.`}
                confirmLabel={`Delete ${selected.size} Records`}
            />

            {/* Create/Edit form modal */}
            <DnsRecordFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditRecord(null); }}
                onSave={handleFormSave}
                record={editRecord}
            />
        </>
    );
}

// Needed for empty state icon import
function Globe({ size, className }: { size: number; className: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}