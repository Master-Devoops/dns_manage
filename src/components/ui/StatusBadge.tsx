import React from 'react';

type StatusVariant =
    | 'active' | 'degraded' | 'down' | 'unknown' | 'propagating' | 'live' | 'pending' | 'stale' | 'valid' | 'expiring' | 'critical' | 'expired';

interface StatusBadgeProps {
    variant: StatusVariant;
    label?: string;
    showDot?: boolean;
    size?: 'sm' | 'md';
}

const variantConfig: Record<
    StatusVariant,
    { bg: string; text: string; dot: string; defaultLabel: string }
> = {
    active: {
        bg: 'bg-[var(--status-active-bg)]',
        text: 'text-[var(--status-active)]',
        dot: 'status-dot-active',
        defaultLabel: 'Active',
    },
    degraded: {
        bg: 'bg-[var(--status-degraded-bg)]',
        text: 'text-[var(--status-degraded)]',
        dot: 'status-dot-degraded',
        defaultLabel: 'Degraded',
    },
    down: {
        bg: 'bg-[var(--status-down-bg)]',
        text: 'text-[var(--status-down)]',
        dot: 'status-dot-down',
        defaultLabel: 'Down',
    },
    unknown: {
        bg: 'bg-[var(--status-unknown-bg)]',
        text: 'text-[var(--status-unknown)]',
        dot: 'status-dot-unknown',
        defaultLabel: 'Unknown',
    },
    propagating: {
        bg: 'bg-primary/10',
        text: 'text-primary',
        dot: 'bg-primary',
        defaultLabel: 'Propagating',
    },
    live: {
        bg: 'bg-[var(--status-active-bg)]',
        text: 'text-[var(--status-active)]',
        dot: 'status-dot-active',
        defaultLabel: 'Live',
    },
    pending: {
        bg: 'bg-warning/10',
        text: 'text-warning',
        dot: 'bg-warning',
        defaultLabel: 'Pending',
    },
    stale: {
        bg: 'bg-[var(--status-unknown-bg)]',
        text: 'text-[var(--status-unknown)]',
        dot: 'status-dot-unknown',
        defaultLabel: 'Stale',
    },
    valid: {
        bg: 'bg-[var(--status-active-bg)]',
        text: 'text-[var(--status-active)]',
        dot: 'status-dot-active',
        defaultLabel: 'Valid',
    },
    expiring: {
        bg: 'bg-warning/10',
        text: 'text-warning',
        dot: 'bg-warning',
        defaultLabel: 'Expiring',
    },
    critical: {
        bg: 'bg-[var(--status-down-bg)]',
        text: 'text-[var(--status-down)]',
        dot: 'status-dot-down',
        defaultLabel: 'Critical',
    },
    expired: {
        bg: 'bg-[var(--status-unknown-bg)]',
        text: 'text-[var(--status-unknown)]',
        dot: 'status-dot-unknown',
        defaultLabel: 'Expired',
    },
};

export default function StatusBadge({
    variant,
    label,
    showDot = true,
    size = 'sm',
}: StatusBadgeProps) {
    const config = variantConfig[variant];
    const displayLabel = label ?? config.defaultLabel;

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bg} ${config.text}
        ${size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs'}
      `}
        >
            {showDot && (
                <span
                    className={`inline-block rounded-full flex-shrink-0 ${config.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
                />
            )}
            {displayLabel}
        </span>
    );
}