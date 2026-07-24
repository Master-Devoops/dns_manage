'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { Info } from 'lucide-react';

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

interface FormValues {
    type: DnsRecord['type'];
    name: string;
    value: string;
    ttl: number;
    priority?: number;
}

interface DnsRecordFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<DnsRecord>) => void;
    record: DnsRecord | null;
}

const TTL_PRESETS = [
    { label: '1 min', value: 60 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '1 hour', value: 3600 },
    { label: '12 hours', value: 43200 },
    { label: '1 day', value: 86400 },
];

const RECORD_TYPES: DnsRecord['type'][] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'];

const typeHelp: Record<string, string> = {
    A: 'Maps a subdomain to an IPv4 address (e.g. 165.22.214.88)',
    AAAA: 'Maps a subdomain to an IPv6 address',
    CNAME: 'Aliases a subdomain to another hostname (e.g. cdn.cloudflare.net)',
    MX: 'Specifies mail servers for the domain. Priority determines preference.',
    TXT: 'Arbitrary text records — used for SPF, DKIM, domain verification',
    NS: 'Delegates a subdomain to a different set of nameservers',
    SRV: 'Specifies location of services. Format: priority weight port target',
};

export default function DnsRecordFormModal({
    isOpen,
    onClose,
    onSave,
    record,
}: DnsRecordFormModalProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            type: 'A',
            name: '',
            value: '',
            ttl: 300,
            priority: undefined,
        },
    });

    const selectedType = watch('type');
    const showPriority = selectedType === 'MX' || selectedType === 'SRV';

    useEffect(() => {
        if (record) {
            reset({
                type: record.type,
                name: record.name,
                value: record.value,
                ttl: record.ttl,
                priority: record.priority,
            });
        } else {
            reset({ type: 'A', name: '', value: '', ttl: 300, priority: undefined });
        }
    }, [record, reset, isOpen]);

    const onSubmit = async (data: FormValues) => {
        // Backend integration point: POST /api/dns-records or PUT /api/dns-records/:id
        await new Promise((r) => setTimeout(r, 800));
        onSave(data);
        reset();
    };

    const fieldError = (msg?: string) =>
        msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={record ? `Edit ${record.type} Record` : 'Create DNS Record'}
            subtitle={record ? `Modifying ${record.name}.devoops.in` : 'New record for devoops.in — will sync to GoDaddy'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Record Type */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Record Type <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {RECORD_TYPES.map((t) => (
                            <button
                                key={`type-btn-${t}`}
                                type="button"
                                onClick={() => setValue('type', t)}
                                className={`py-1.5 text-xs font-bold font-mono rounded border transition-all ${selectedType === t
                                        ? 'bg-primary/15 text-primary border-primary/40' : 'bg-muted text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    {selectedType && (
                        <div className="flex items-start gap-2 mt-2 p-2.5 bg-muted/40 rounded-md border border-border">
                            <Info size={12} className="text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">{typeHelp[selectedType]}</p>
                        </div>
                    )}
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Name (Subdomain) <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        Use <code className="font-mono bg-muted px-1 rounded">@</code> for the root domain, or enter a subdomain name (e.g. <code className="font-mono bg-muted px-1 rounded">api</code>)
                    </p>
                    <div className="flex items-center">
                        <input
                            {...register('name', {
                                required: 'Subdomain name is required',
                                pattern: {
                                    value: /^(@|[a-zA-Z0-9_*-]+(\.[a-zA-Z0-9_*-]+)*)$/,
                                    message: 'Use @ for root or alphanumeric subdomain name',
                                },
                            })}
                            type="text"
                            placeholder="api"
                            className={`input-base rounded-r-none ${errors.name ? 'input-error' : ''}`}
                        />
                        <span className="h-9 flex items-center px-3 bg-muted border border-l-0 border-border rounded-r-md text-xs text-muted-foreground font-mono whitespace-nowrap">
                            .devoops.in
                        </span>
                    </div>
                    {fieldError(errors.name?.message)}
                </div>

                {/* Value */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        {selectedType === 'A' || selectedType === 'AAAA' ? 'IP Address' : 'Value / Target'}{' '}
                        <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        {selectedType === 'A' && 'IPv4 address this subdomain should resolve to (e.g. 165.22.214.88)'}
                        {selectedType === 'AAAA' && 'IPv6 address this subdomain should resolve to'}
                        {selectedType === 'CNAME' && 'Target hostname (e.g. devoops.github.io or cdn.cloudflare.net)'}
                        {selectedType === 'MX' && 'Mail server hostname (e.g. mail.devoops.in)'}
                        {selectedType === 'TXT' && 'Full text value (e.g. v=spf1 include:sendgrid.net ~all)'}
                        {selectedType === 'NS' && 'Nameserver hostname (e.g. ns1.example.com)'}
                        {selectedType === 'SRV' && 'Format: weight port target (e.g. 0 5060 sip.devoops.in)'}
                    </p>
                    {selectedType === 'TXT' ? (
                        <textarea
                            {...register('value', { required: 'Record value is required' })}
                            rows={3}
                            placeholder="v=spf1 include:sendgrid.net ~all"
                            className={`input-base font-mono resize-none ${errors.value ? 'input-error' : ''}`}
                        />
                    ) : (
                        <input
                            {...register('value', {
                                required: 'Record value is required',
                                validate: (v) => {
                                    if ((selectedType === 'A') && !/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) {
                                        return 'Enter a valid IPv4 address (e.g. 165.22.214.88)';
                                    }
                                    return true;
                                },
                            })}
                            type="text"
                            placeholder={
                                selectedType === 'A' ? '165.22.214.88' :
                                    selectedType === 'CNAME' ? 'target.example.com' :
                                        selectedType === 'MX' ? 'mail.devoops.in' : ''
                            }
                            className={`input-base font-mono ${errors.value ? 'input-error' : ''}`} />
                    )}
                    {fieldError(errors.value?.message)}
                </div>

                {/* TTL + Priority row */}
                <div className={`grid gap-4 ${showPriority ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* TTL */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            TTL (Time to Live) <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            How long DNS resolvers cache this record (in seconds)
                        </p>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                            {TTL_PRESETS.map((p) => (
                                <button
                                    key={`ttl-${p.value}`}
                                    type="button"
                                    onClick={() => setValue('ttl', p.value)}
                                    className={`px-2 py-1 text-2xs font-mono font-semibold rounded border transition-all ${watch('ttl') === p.value
                                            ? 'bg-primary/15 text-primary border-primary/40' : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <input
                            {...register('ttl', {
                                required: 'TTL is required',
                                min: { value: 60, message: 'Minimum TTL is 60 seconds' },
                                max: { value: 86400, message: 'Maximum TTL is 86400 seconds (1 day)' },
                                valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="300"
                            className={`input-base font-mono ${errors.ttl ? 'input-error' : ''}`}
                        />
                        {fieldError(errors.ttl?.message)}
                    </div>

                    {/* Priority (MX/SRV only) */}
                    {showPriority && (
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                                Priority <span className="text-destructive">*</span>
                            </label>
                            <p className="text-xs text-muted-foreground mb-1.5">
                                Lower number = higher priority (e.g. 10 is preferred over 20)
                            </p>
                            <input
                                {...register('priority', {
                                    required: showPriority ? 'Priority is required for MX/SRV records' : false,
                                    min: { value: 0, message: 'Priority must be 0 or higher' },
                                    max: { value: 65535, message: 'Priority must be 65535 or lower' },
                                    valueAsNumber: true,
                                })}
                                type="number"
                                placeholder="10"
                                className={`input-base font-mono ${errors.priority ? 'input-error' : ''}`}
                            />
                            {fieldError(errors.priority?.message)}
                        </div>
                    )}
                </div>

                {/* GoDaddy sync notice */}
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        This record will be pushed to GoDaddy via API immediately after saving.
                        DNS propagation typically takes <strong className="text-foreground">5–30 minutes</strong> globally.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-1 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                        style={{ minWidth: '120px' }}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center w-full">
                                <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : record ? (
                            'Update Record'
                        ) : (
                            'Create Record'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}