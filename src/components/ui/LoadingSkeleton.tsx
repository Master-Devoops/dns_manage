import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-muted rounded ${className}`}
            aria-hidden="true"
        />
    );
}

export function KpiCardSkeleton() {
    return (
        <div className="card-elevated p-5">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
        </div>
    );
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-0">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={`skeleton-row-${i + 1}`}
                    className="flex items-center gap-4 px-4 py-3 border-b border-border"
                >
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton
                            key={`skeleton-cell-${i + 1}-${j + 1}`}
                            className="h-4 flex-1"
                            style={{ transitionDelay: `${j * 50}ms` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}