'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, Save } from 'lucide-react';
import { toast } from 'sonner';

interface HealthFormValues {
    checkInterval: number;
    checkTimeout: number;
    alertOnFailures: number;
    alertOnResponseMs: number;
    checkHttp: boolean;
    checkSsl: boolean;
    checkDns: boolean;
    sslWarningDays: number;
    sslCriticalDays: number;
}

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
                className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200 ${checked ? 'bg-primary' : 'bg-muted'
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

export default function HealthCheckConfigPanel() {
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HealthFormValues>({
        defaultValues: {
            // Backend integration point: GET /api/settings/health-check-config
            checkInterval: 60,
            checkTimeout: 10,
            alertOnFailures: 3,
            alertOnResponseMs: 1000,
            checkHttp: true,
            checkSsl: true,
            checkDns: true,
            sslWarningDays: 30,
            sslCriticalDays: 7,
        },
    });

    const checkHttp = watch('checkHttp');
    const checkSsl = watch('checkSsl');
    const checkDns = watch('checkDns');

    const onSubmit = async (data: HealthFormValues) => {
        setIsSaving(true);
        // Backend integration point: PUT /api/settings/health-check-config
        await new Promise((r) => setTimeout(r, 900));
        setIsSaving(false);
        toast.success('Health check configuration saved');
        void data;
    };

    return (
        <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-5">
                <Activity size={15} className="text-accent" />
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Health Check Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Configure monitoring intervals and alert thresholds
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Check types */}
                <div className="space-y-3 p-3 bg-muted/40 border border-border rounded-md">
                    <p className="text-xs font-semibold text-foreground">Check Types</p>
                    <Toggle
                        id="toggle-http"
                        checked={checkHttp}
                        onChange={(v) => setValue('checkHttp', v)}
                        label="HTTP/HTTPS health check"
                        description="Verify subdomains return 2xx HTTP status codes"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-ssl"
                        checked={checkSsl}
                        onChange={(v) => setValue('checkSsl', v)}
                        label="SSL certificate monitoring"
                        description="Track certificate expiry dates and validity"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-dns"
                        checked={checkDns}
                        onChange={(v) => setValue('checkDns', v)}
                        label="DNS resolution check"
                        description="Verify DNS records resolve to expected targets"
                    />
                </div>

                {/* Intervals */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Check Interval (s)
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">How often to run checks</p>
                        <input
                            {...register('checkInterval', {
                                min: { value: 30, message: 'Min 30s' },
                                max: { value: 3600, message: 'Max 3600s' },
                                valueAsNumber: true,
                            })}
                            type="number"
                            className={`input-base font-mono ${errors.checkInterval ? 'input-error' : ''}`}
                        />
                        {errors.checkInterval && (
                            <p className="text-xs text-destructive mt-1">{errors.checkInterval.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Request Timeout (s)
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">Max wait per check</p>
                        <input
                            {...register('checkTimeout', {
                                min: { value: 1, message: 'Min 1s' },
                                max: { value: 60, message: 'Max 60s' },
                                valueAsNumber: true,
                            })}
                            type="number"
                            className={`input-base font-mono ${errors.checkTimeout ? 'input-error' : ''}`}
                        />
                    </div>
                </div>

                {/* Alert thresholds */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Alert After N Failures
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Consecutive failures before alerting
                        </p>
                        <input
                            {...register('alertOnFailures', { min: 1, max: 10, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Slow Response Threshold (ms)
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">Warn if response exceeds</p>
                        <input
                            {...register('alertOnResponseMs', { min: 100, max: 10000, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                </div>

                {/* SSL thresholds */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            SSL Warning (days)
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Warn when cert expires within
                        </p>
                        <input
                            {...register('sslWarningDays', { min: 7, max: 90, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            SSL Critical (days)
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Mark as critical when expires within
                        </p>
                        <input
                            {...register('sslCriticalDays', { min: 1, max: 30, valueAsNumber: true })}
                            type="number"
                            className="input-base font-mono"
                        />
                    </div>
                </div>

                <div className="pt-1 border-t border-border">
                    <button type="submit" disabled={isSaving} className="btn-primary text-xs w-full justify-center">
                        {isSaving ? (
                            <><span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={13} /> Save Health Config</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}