'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Save, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookFormValues {
    slackWebhook: string;
    discordWebhook: string;
    customWebhook: string;
    emailAlert: string;
    notifyOnDown: boolean;
    notifyOnSslExpiry: boolean;
    notifyOnSyncError: boolean;
    notifyOnPropagation: boolean;
}

interface ToggleProps {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    id: string;
}

function Toggle({ checked, onChange, label, id }: ToggleProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label htmlFor={id} className="text-xs text-foreground cursor-pointer">{label}</label>
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

export default function WebhookPanel() {
    const [isSaving, setIsSaving] = useState(false);
    const [testingSlack, setTestingSlack] = useState(false);

    const { register, handleSubmit, watch, setValue } = useForm<WebhookFormValues>({
        defaultValues: {
            // Backend integration point: GET /api/settings/webhook-config
            slackWebhook: 'https://hooks.slack.com/services/T0XXXX/B0XXXX/XXXX',
            discordWebhook: '',
            customWebhook: '',
            emailAlert: 'devops@devoops.in',
            notifyOnDown: true,
            notifyOnSslExpiry: true,
            notifyOnSyncError: true,
            notifyOnPropagation: false,
        },
    });

    const notifyOnDown = watch('notifyOnDown');
    const notifyOnSslExpiry = watch('notifyOnSslExpiry');
    const notifyOnSyncError = watch('notifyOnSyncError');
    const notifyOnPropagation = watch('notifyOnPropagation');

    const handleTestSlack = async () => {
        setTestingSlack(true);
        // Backend integration point: POST /api/settings/test-webhook?type=slack
        await new Promise((r) => setTimeout(r, 1500));
        setTestingSlack(false);
        toast.success('Test notification sent to Slack', {
            description: 'Check #devops-alerts channel for the test message',
        });
    };

    const onSubmit = async (data: WebhookFormValues) => {
        setIsSaving(true);
        // Backend integration point: PUT /api/settings/webhook-config
        await new Promise((r) => setTimeout(r, 900));
        setIsSaving(false);
        toast.success('Notification settings saved');
        void data;
    };

    return (
        <div className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-5">
                <Bell size={15} className="text-warning" />
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Notifications & Webhooks</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Alert endpoints for health events and sync failures
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Slack */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Slack Incoming Webhook
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        From Slack → Apps → Incoming Webhooks
                    </p>
                    <div className="flex gap-2">
                        <input
                            {...register('slackWebhook')}
                            type="url"
                            placeholder="https://hooks.slack.com/services/..."
                            className="input-base font-mono text-xs flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleTestSlack}
                            disabled={testingSlack}
                            className="btn-secondary text-xs px-3 flex-shrink-0"
                            aria-label="Send test Slack notification"
                        >
                            {testingSlack ? (
                                <span className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <TestTube size={13} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Discord */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Discord Webhook
                    </label>
                    <input
                        {...register('discordWebhook')}
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        className="input-base font-mono text-xs"
                    />
                </div>

                {/* Custom webhook */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Custom Webhook URL
                    </label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                        POST requests sent with JSON payload on alert events
                    </p>
                    <input
                        {...register('customWebhook')}
                        type="url"
                        placeholder="https://your-service.com/webhook"
                        className="input-base font-mono text-xs"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                        Alert Email Address
                    </label>
                    <input
                        {...register('emailAlert')}
                        type="email"
                        placeholder="devops@devoops.in"
                        className="input-base text-xs"
                    />
                </div>

                {/* Notification triggers */}
                <div className="space-y-3 p-3 bg-muted/40 border border-border rounded-md">
                    <p className="text-xs font-semibold text-foreground mb-2">Notify When</p>
                    <Toggle
                        id="toggle-notify-down"
                        checked={notifyOnDown}
                        onChange={(v) => setValue('notifyOnDown', v)}
                        label="Subdomain goes down or returns 5xx"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-notify-ssl"
                        checked={notifyOnSslExpiry}
                        onChange={(v) => setValue('notifyOnSslExpiry', v)}
                        label="SSL certificate expiry warning"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-notify-sync"
                        checked={notifyOnSyncError}
                        onChange={(v) => setValue('notifyOnSyncError', v)}
                        label="GoDaddy sync fails or times out"
                    />
                    <div className="border-t border-border" />
                    <Toggle
                        id="toggle-notify-prop"
                        checked={notifyOnPropagation}
                        onChange={(v) => setValue('notifyOnPropagation', v)}
                        label="DNS record finishes propagating"
                    />
                </div>

                <div className="pt-1 border-t border-border">
                    <button type="submit" disabled={isSaving} className="btn-primary text-xs w-full justify-center">
                        {isSaving ? (
                            <><span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={13} /> Save Notification Settings</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}