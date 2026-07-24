'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SyncFormValues {
    syncFrequency: string;
    autoSync: boolean;
    propagationTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    syncOnCreate: boolean;
    syncOnUpdate: boolean;
    syncOnDelete: boolean;
}

const FREQUENCY_OPTIONS = [
    { label: '1 minute', value: '1' },
    { label: '5 minutes', value: '5' },
    { label: '15 minutes', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: '1 hour', value: '60' },
    { label: 'Manual only', value: '0' },
];

interface ToggleProps {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
    id: string;
}

function Toggle({ checked, onChange, label, description, id }: ToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <label htmlFor={id} className="text-xs font-semibold text-foreground cursor-pointer">
                    {label}
                </label>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card ${checked ? 'bg-primary' : 'bg-muted'
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

export default function SyncConfigPanel() {
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SyncFormValues>({
        defaultValues: {
            // Backend integration point: GET /api/settings/sync-config
            syncFrequency: '5',
            autoSync: true,
            propagationTimeout: 120,
            retryAttempts: 3,
            retryDelay: 30,
            syncOnCreate: true,
            syncOnUpdate: true,
            syncOnDelete: false,
        },
    });

    const autoSync = watch('autoSync');
    const syncOnCreate = watch('syncOnCreate');
    const syncOnUpdate = watch('syncOnUpdate');
    const syncOnDelete = watch('syncOnDelete');

    const onSubmit = async (data: SyncFormValues) => {
        setIsSaving(true);
        // Backend integration point: PUT /api/settings/sync-config
        await new Promise((r) => setTimeout(r, 900));
        setIsSaving(false);
        toast.success('Sync configuration saved');
        void data;
    };

    return (
        <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-5">
                <RefreshCw size={15} className="text-primary" />
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Sync Configuration</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Control how and when changes sync to GoDaddy
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Auto sync toggle */}
                <Toggle
                    id="toggle-autosync"
                    checked={autoSync}
                    onChange={(v) => setValue('autoSync', v)}
                    label="Auto-sync enabled"
                    description="Automatically push DNS changes to GoDaddy on the configured schedule"
                />

                {/* Sync frequency */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Sync Frequency
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        How often the dashboard polls GoDaddy for record changes
                    </p>
                    <select
                        {...register('syncFrequency')}
                        disabled={!autoSync}
                        className="input-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {FREQUENCY_OPTIONS.map((o) => (
                            <option key={`freq-${o.value}`} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Propagation timeout */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Propagation Timeout (seconds)
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        How long to wait before marking a record as stale after a push
                    </p>
                    <input
                        {...register('propagationTimeout', {
                            min: { value: 30, message: 'Minimum 30 seconds' },
                            max: { value: 3600, message: 'Maximum 3600 seconds' },
                            valueAsNumber: true,
                        })}
                        type="number"
                        className={`input-base font-mono ${errors.propagationTimeout ? 'input-error' : ''}`}
                    />
                    {errors.propagationTimeout && (
                        <p className="text-xs text-destructive mt-1">{errors.propagationTimeout.message}</p>
                    )}
                </div>

                {/* Retry settings */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Retry Attempts
                        </label>
                        <input
                            {...register('retryAttempts', { min: 0, max: 10, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Retry Delay (s)
                        </label>
                        <input
                            {...register('retryDelay', { min: 5, max: 300, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                </div>

                {/* Trigger settings */}
                <div className="space-y-3 p-3 bg-muted/40 border border-border rounded-md">
                    <p className="text-xs font-semibold text-foreground mb-2">Sync Triggers</p>
                    <Toggle
                        id="toggle-sync-create"
                        checked={syncOnCreate}
                        onChange={(v) => setValue('syncOnCreate', v)}
                        label="Sync on record create"
                        description="Immediately push new records to GoDaddy"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-sync-update"
                        checked={syncOnUpdate}
                        onChange={(v) => setValue('syncOnUpdate', v)}
                        label="Sync on record update"
                        description="Push changes to GoDaddy when a record is edited"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-sync-delete"
                        checked={syncOnDelete}
                        onChange={(v) => setValue('syncOnDelete', v)}
                        label="Sync on record delete"
                        description="Remove deleted records from GoDaddy immediately"
                    />
                </div>

                <div className="pt-1 border-t border-border">
                    <button type="submit" disabled={isSaving} className="btn-primary text-xs w-full justify-center">
                        {isSaving ? (
                            <><span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={13} /> Save Sync Config</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}