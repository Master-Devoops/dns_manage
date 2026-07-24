'use client';

import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

const healthData = [
    { date: 'Jul 10', passRate: 93.2, checks: 84, failures: 6 },
    { date: 'Jul 11', passRate: 91.7, checks: 84, failures: 7 },
    { date: 'Jul 12', passRate: 87.5, checks: 80, failures: 10 },
    { date: 'Jul 13', passRate: 85.7, checks: 84, failures: 12 },
    { date: 'Jul 14', passRate: 88.1, checks: 84, failures: 10 },
    { date: 'Jul 15', passRate: 92.9, checks: 84, failures: 6 },
    { date: 'Jul 16', passRate: 95.2, checks: 84, failures: 4 },
    { date: 'Jul 17', passRate: 94.0, checks: 84, failures: 5 },
    { date: 'Jul 18', passRate: 96.4, checks: 84, failures: 3 },
    { date: 'Jul 19', passRate: 90.5, checks: 84, failures: 8 },
    { date: 'Jul 20', passRate: 88.1, checks: 84, failures: 10 },
    { date: 'Jul 21', passRate: 91.7, checks: 84, failures: 7 },
    { date: 'Jul 22', passRate: 93.5, checks: 84, failures: 5 },
    { date: 'Jul 23', passRate: 87.5, checks: 84, failures: 10 },
    { date: 'Jul 24', passRate: 85.7, checks: 84, failures: 12 },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: typeof healthData[number] }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="card-elevated p-3 shadow-xl text-xs min-w-[140px]">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Pass Rate</span>
                    <span className="font-mono font-semibold text-accent">{d.passRate}%</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total Checks</span>
                    <span className="font-mono text-foreground">{d.checks}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Failures</span>
                    <span className="font-mono text-destructive">{d.failures}</span>
                </div>
            </div>
        </div>
    );
}

export default function HealthTrendChart() {
    const [range] = useState('14d');

    return (
        <div className="card-elevated p-5 h-full">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Health Check Pass Rate</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        All subdomains · 6 checks/day per subdomain
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {['7d', '14d', '30d'].map((r) => (
                        <button
                            key={`range-${r}`}
                            className={`px-2.5 py-1 text-2xs font-semibold rounded transition-all ${range === r
                                    ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={healthData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
                            axisLine={false}
                            tickLine={false}
                            interval={2}
                        />
                        <YAxis
                            domain={[80, 100]}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={90}
                            stroke="var(--muted-foreground)"
                            strokeDasharray="4 4"
                            strokeOpacity={0.4}
                        />
                        <Area
                            type="monotone"
                            dataKey="passRate"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            fill="url(#healthGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-accent rounded" />
                    <span className="text-2xs text-muted-foreground">Pass rate</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-px border-t border-dashed border-muted-foreground" />
                    <span className="text-2xs text-muted-foreground">90% threshold</span>
                </div>
                <div className="ml-auto text-2xs text-muted-foreground font-mono">
                    Avg: <span className="text-foreground font-semibold">91.2%</span>
                </div>
            </div>
        </div>
    );
}