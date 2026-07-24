'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
} from 'recharts';

interface KpiCardProps {
    id: string;
    label: string;
    value: string;
    sub: string;
    trend: string;
    trendUp: boolean | null;
    variant: 'hero' | 'alert' | 'warning' | 'normal' | 'info';
    accentColor: 'primary' | 'danger' | 'warning' | 'muted' | 'info' | 'accent';
    sparkData?: number[];
}

const variantStyles: Record<string, string> = {
    hero: 'card-elevated glow-primary',
    alert: 'card-elevated border-destructive/30 bg-destructive/5',
    warning: 'card-elevated border-warning/30 bg-warning/5',
    normal: 'card-elevated',
    info: 'card-elevated border-primary/20',
};

const accentColorMap: Record<string, string> = {
    primary: 'var(--primary)',
    danger: '#ef4444',
    warning: '#f59e0b',
    muted: 'var(--muted-foreground)',
    info: 'var(--primary)',
    accent: 'var(--accent)',
};

const trendColorMap: Record<string, string> = {
    up: 'text-accent',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
};

export default function KpiCard({
    id,
    label,
    value,
    sub,
    trend,
    trendUp,
    variant,
    accentColor,
    sparkData,
}: KpiCardProps) {
    const color = accentColorMap[accentColor];
    const trendClass =
        trendUp === true
            ? trendColorMap.up
            : trendUp === false
                ? trendColorMap.down
                : trendColorMap.neutral;

    const chartData = sparkData?.map((v, i) => ({ i, v }));

    return (
        <div
            className={`${variantStyles[variant]} p-5 h-full min-h-[120px] flex flex-col justify-between card-hover transition-all duration-200`}
            aria-label={`${label}: ${value}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p
                        className="text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: 'var(--muted-foreground)' }}
                    >
                        {label}
                    </p>
                    <p
                        className="text-3xl font-bold tabular-nums leading-none mb-1"
                        style={{ color }}
                    >
                        {value}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{sub}</p>
                </div>

                {sparkData && chartData && (
                    <div className="w-20 h-12 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="v"
                                    stroke={color}
                                    strokeWidth={1.5}
                                    fill={`url(#grad-${id})`}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <p className={`text-2xs font-medium mt-3 ${trendClass}`}>{trend}</p>
        </div>
    );
}