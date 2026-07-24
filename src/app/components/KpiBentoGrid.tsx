import React from 'react';
import KpiCard from './KpiCard';

// Bento grid plan: 6 cards → grid-cols-3, 2 rows
// Row 1: Hero (spans 2 cols) + 1 regular
// Row 2: 3 regular cards
export default function KpiBentoGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
            {/* Hero card — spans 2 cols */}
            <div className="sm:col-span-2 lg:col-span-2">
                <KpiCard
                    id="kpi-active-subdomains"
                    label="Active Subdomains"
                    value="14"
                    sub="of 16 total — 2 degraded"
                    trend="+2 this week"
                    trendUp={true}
                    variant="hero"
                    accentColor="primary"
                    sparkData={[8, 9, 9, 10, 11, 11, 12, 12, 13, 14, 14, 14]}
                />
            </div>

            {/* Failing health checks — alert state */}
            <div>
                <KpiCard
                    id="kpi-failing"
                    label="Failing Health Checks"
                    value="2"
                    sub="api.devoops.in, cdn.devoops.in"
                    trend="↑ 1 since yesterday"
                    trendUp={false}
                    variant="alert"
                    accentColor="danger"
                />
            </div>

            {/* SSL expiring */}
            <div>
                <KpiCard
                    id="kpi-ssl-expiring"
                    label="SSL Certs Expiring"
                    value="3"
                    sub="within 30 days"
                    trend="mail expires in 6d"
                    trendUp={false}
                    variant="warning"
                    accentColor="warning"
                />
            </div>

            {/* DNS records */}
            <div>
                <KpiCard
                    id="kpi-dns-records"
                    label="Total DNS Records"
                    value="38"
                    sub="A · CNAME · MX · TXT"
                    trend="3 pending propagation"
                    trendUp={null}
                    variant="normal"
                    accentColor="muted"
                />
            </div>

            {/* Propagation pending */}
            <div>
                <KpiCard
                    id="kpi-propagation"
                    label="Propagation Pending"
                    value="3"
                    sub="avg 12 min remaining"
                    trend="Last push 8 min ago"
                    trendUp={null}
                    variant="info"
                    accentColor="info"
                />
            </div>
        </div>
    );
}