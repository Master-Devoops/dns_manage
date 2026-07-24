'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Zap, CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ApiFormValues {
    apiKey: string;
    apiSecret: string;
    domain: string;
    environment: 'production' | 'ote';
}

type ConnectionStatus = 'connected' | 'disconnected' | 'testing' | 'error';

export default function ApiCredentialsPanel() {
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
    const [isSaving, setIsSaving] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [hasUnsaved, setHasUnsaved] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch,
    } = useForm<ApiFormValues>({
        defaultValues: {
            // Backend integration point: GET /api/settings/godaddy-credentials
            apiKey: 'dh4Kx9mP2vQnRsT7wYzA',
            apiSecret: 'SecretKey_Placeholder_32chars_here',
            domain: 'devoops.in',
            environment: 'production',
        },
    });

    const watchedValues = watch();

    React.useEffect(() => {
        setHasUnsaved(isDirty);
    }, [isDirty]);

    const handleTest = async () => {
        setConnectionStatus('testing');
        // Backend integration point: POST /api/godaddy/test-connection
        await new Promise((r) => setTimeout(r, 2000));
        setConnectionStatus('connected');
        toast.success('GoDaddy API connection verified', {
            description: `Successfully authenticated for ${watchedValues.domain}`,
        });
    };

    const onSubmit = async (data: ApiFormValues) => {
        setIsSaving(true);
        // Backend integration point: PUT /api/settings/godaddy-credentials
        await new Promise((r) => setTimeout(r, 1200));
        setIsSaving(false);
        setHasUnsaved(false);
        reset(data);
        toast.success('API credentials saved', {
            description: 'GoDaddy API configuration updated successfully',
        });
    };

    const handleReset = async () => {
        setIsResetting(true);
        // Backend integration point: DELETE /api/settings/godaddy-credentials
        await new Promise((r) => setTimeout(r, 1000));
        setIsResetting(false);
        setResetOpen(false);
        setConnectionStatus('disconnected');
        reset({ apiKey: '', apiSecret: '', domain: 'devoops.in', environment: 'production' });
        toast.success('API credentials cleared — re-enter to reconnect');
    };

    const statusConfig = {
        connected: { label: 'Connected', color: 'text-accent', bg: 'bg-accent/10 border-accent/20', Icon: CheckCircle2 },
        disconnected: { label: 'Disconnected', color: 'text-muted-foreground', bg: 'bg-muted/40 border-border', Icon: XCircle },
        testing: { label: 'Testing...', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', Icon: Loader2 },
        error: { label: 'Auth Failed', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', Icon: XCircle },
    };

    const cs = statusConfig[connectionStatus];
    const CsIcon = cs.Icon;

    return (
        <>
            <div className="card-elevated p-5">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">GoDaddy API Credentials</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            API key and secret from your GoDaddy developer account
                        </p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border ${cs.bg} ${cs.color}`}>
                        <CsIcon size={12} className={connectionStatus === 'testing' ? 'animate-spin' : ''} />
                        {cs.label}
                    </div>
                </div>

                {hasUnsaved && (
                    <div className="flex items-center gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-md mb-4 text-xs text-warning">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                        You have unsaved changes
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Domain */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Domain <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            The domain registered in GoDaddy you want to manage
                        </p>
                        <input
                            {...register('domain', { required: 'Domain is required' })}
                            type="text"
                            className={`input-base font-mono ${errors.domain ? 'input-error' : ''}`}
                            placeholder="devoops.in"
                        />
                        {errors.domain && (
                            <p className="text-xs text-destructive mt-1">{errors.domain.message}</p>
                        )}
                    </div>

                    {/* Environment */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            Environment
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Use OTE (test environment) for development, Production for live changes
                        </p>
                        <div className="flex gap-2">
                            {(['production', 'ote'] as const).map((env) => (
                                <label
                                    key={`env-${env}`}
                                    className={`flex items-center gap-2 flex-1 p-3 rounded-md border cursor-pointer transition-all ${watchedValues.environment === env
                                            ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground hover:border-muted-foreground'
                                        }`}
                                >
                                    <input
                                        {...register('environment')}
                                        type="radio"
                                        value={env}
                                        className="sr-only"
                                    />
                                    <span className="text-xs font-semibold capitalize">{env === 'ote' ? 'OTE (Test)' : 'Production'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            API Key <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Found in GoDaddy Developer Portal → API Keys
                        </p>
                        <div className="relative">
                            <input
                                {...register('apiKey', {
                                    required: 'API Key is required',
                                    minLength: { value: 8, message: 'API Key must be at least 8 characters' },
                                })}
                                type={showKey ? 'text' : 'password'}
                                className={`input-base font-mono pr-10 ${errors.apiKey ? 'input-error' : ''}`}
                                placeholder="Your GoDaddy API key"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-ghost p-1"
                                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                            >
                                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {errors.apiKey && (
                            <p className="text-xs text-destructive mt-1">{errors.apiKey.message}</p>
                        )}
                    </div>

                    {/* API Secret */}
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            API Secret <span className="text-destructive">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            Paired with your API Key — never share this value
                        </p>
                        <div className="relative">
                            <input
                                {...register('apiSecret', {
                                    required: 'API Secret is required',
                                    minLength: { value: 8, message: 'API Secret must be at least 8 characters' },
                                })}
                                type={showSecret ? 'text' : 'password'}
                                className={`input-base font-mono pr-10 ${errors.apiSecret ? 'input-error' : ''}`}
                                placeholder="Your GoDaddy API secret"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-ghost p-1"
                                aria-label={showSecret ? 'Hide API secret' : 'Show API secret'}
                            >
                                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {errors.apiSecret && (
                            <p className="text-xs text-destructive mt-1">{errors.apiSecret.message}</p>
                        )}
                    </div>

                    {/* Rate limit info */}
                    <div className="p-3 bg-muted/40 border border-border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">GoDaddy API Rate Limit</span>
                            <span className="text-2xs font-mono text-muted-foreground">Resets in 00:43</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '34%' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-2xs text-muted-foreground">170 / 500 requests used</span>
                            <span className="text-2xs text-primary font-mono">34%</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={connectionStatus === 'testing'}
                            className="btn-secondary text-xs flex-1"
                        >
                            {connectionStatus === 'testing' ? (
                                <><Loader2 size={13} className="animate-spin" /> Testing...</>
                            ) : (
                                <><Zap size={13} /> Test Connection</>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary text-xs flex-1"
                        >
                            {isSaving ? (
                                <><span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
                            ) : (
                                'Save Credentials'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setResetOpen(true)}
                            className="btn-ghost text-xs p-2"
                            title="Reset API credentials — disconnects from GoDaddy"
                            aria-label="Reset API credentials"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal
                isOpen={resetOpen}
                onClose={() => setResetOpen(false)}
                onConfirm={handleReset}
                isLoading={isResetting}
                title="Reset API credentials?"
                description="This will clear your GoDaddy API key and secret. The dashboard will disconnect from GoDaddy until you re-enter valid credentials."
                confirmLabel="Reset Credentials"
            />
        </>
    );
}