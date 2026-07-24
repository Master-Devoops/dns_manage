import React from 'react';
import AppLayout from '@/components/AppLayout';
import SettingsPageHeader from './components/SettingsPageHeader';
import ApiCredentialsPanel from './components/ApiCredentialsPanel';
import SyncConfigPanel from './components/SyncConfigPanel';
import HealthCheckConfigPanel from './components/HealthCheckConfigPanel';
import WebhookPanel from './components/WebhookPanel';
import SyncHistoryTable from './components/SyncHistoryTable';

export default function SettingsApiConfigurationPage() {
    return (
        <AppLayout>
            <div className="space-y-6 fade-in">
                <SettingsPageHeader />
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
                    <ApiCredentialsPanel />
                    <SyncConfigPanel />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
                    <HealthCheckConfigPanel />
                    <WebhookPanel />
                </div>
                <SyncHistoryTable />
            </div>
        </AppLayout>
    );
}