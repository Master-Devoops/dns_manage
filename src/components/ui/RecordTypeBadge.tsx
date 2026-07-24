import React from 'react';

type RecordType = 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'AAAA';

interface RecordTypeBadgeProps {
    type: RecordType;
}

const typeConfig: Record<RecordType, { bg: string; text: string; border: string }> = {
    A: {
        bg: 'bg-primary/10',
        text: 'text-primary',
        border: 'border-primary/30',
    },
    CNAME: {
        bg: 'bg-[#8b5cf6]/10',
        text: 'text-[#8b5cf6]',
        border: 'border-[#8b5cf6]/30',
    },
    MX: {
        bg: 'bg-warning/10',
        text: 'text-warning',
        border: 'border-warning/30',
    },
    TXT: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        border: 'border-accent/30',
    },
    NS: {
        bg: 'bg-[#ec4899]/10',
        text: 'text-[#ec4899]',
        border: 'border-[#ec4899]/30',
    },
    SRV: {
        bg: 'bg-[#f97316]/10',
        text: 'text-[#f97316]',
        border: 'border-[#f97316]/30',
    },
    AAAA: {
        bg: 'bg-[#06b6d4]/10',
        text: 'text-[#06b6d4]',
        border: 'border-[#06b6d4]/30',
    },
};

export default function RecordTypeBadge({ type }: RecordTypeBadgeProps) {
    const config = typeConfig[type] ?? {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
    };

    return (
        <span
            className={`
        inline-flex items-center justify-center
        px-2 py-0.5 rounded border
        text-2xs font-bold font-mono tracking-wider
        ${config.bg} ${config.text} ${config.border}
      `}
        >
            {type}
        </span>
    );
}