import React from 'react';
import AppLayout from '@/components/AppLayout';
import DnsPageHeader from './components/DnsPageHeader';
import DnsRecordTable from './components/DnsRecordTable';

export default function DnsRecordManagementPage() {
    return (
        <AppLayout>
            <div className="space-y-6 fade-in">
                <DnsPageHeader />
                <DnsRecordTable />
            </div>
        </AppLayout>
    );
}