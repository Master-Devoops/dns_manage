import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import KpiBentoGrid from './components/KpiBentoGrid';
import SubdomainHealthTable from './components/SubdomainHealthTable';
import HealthTrendChart from './components/HealthTrendChart';
import SslExpiryPanel from './components/SslExpiryPanel';
import RecentActivityFeed from './components/RecentActivityFeed';

export default function SubdomainDashboardPage() {
    return (
        <AppLayout>
            <div className="space-y-6 fade-in">
                <DashboardHeader />
                <KpiBentoGrid />
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <HealthTrendChart />
                    </div>
                    <div>
                        <SslExpiryPanel />
                    </div>
                </div>
                <SubdomainHealthTable />
                <RecentActivityFeed />
            </div>
        </AppLayout>
    );
}