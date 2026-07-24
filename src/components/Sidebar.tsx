'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Globe,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
    AlertTriangle,
    RefreshCw,
    Terminal,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
    badgeVariant?: 'danger' | 'warning' | 'info';
}

const navItems: NavItem[] = [
    {
        id: 'nav-dashboard',
        label: 'Subdomain Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        id: 'nav-dns',
        label: 'DNS Records',
        href: '/dns-record-management',
        icon: Globe,
        badge: 3,
        badgeVariant: 'warning',
    },
    {
        id: 'nav-settings',
        label: 'API Configuration',
        href: '/settings-api-configuration',
        icon: Settings,
    },
];

const statusItems = [
    { id: 'status-health', label: 'Health Monitor', icon: Activity, color: 'text-accent' },
    { id: 'status-alerts', label: 'Active Alerts', icon: AlertTriangle, color: 'text-warning' },
    { id: 'status-sync', label: 'GoDaddy Sync', icon: RefreshCw, color: 'text-primary' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    const getBadgeClass = (variant?: string) => {
        if (variant === 'danger') return 'bg-destructive text-destructive-foreground';
        if (variant === 'warning') return 'bg-warning text-warning-foreground';
        return 'bg-primary text-primary-foreground';
    };

    return (
        <aside
            className={`
        relative flex flex-col h-screen bg-card border-r border-border
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
        >
            {/* Logo */}
            <div
                className={`
          flex items-center h-14 border-b border-border px-3 flex-shrink-0
          ${collapsed ? 'justify-center' : 'justify-between'}
        `}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <AppLogo size={28} />
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground leading-tight tracking-tight truncate">
                                DevoopsPanel
                            </span>
                            <span className="text-2xs text-muted-foreground font-mono truncate">
                                devoops.in
                            </span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="btn-ghost p-1.5 ml-1 flex-shrink-0"
                        aria-label="Collapse sidebar"
                    >
                        <ChevronLeft size={14} />
                    </button>
                )}
            </div>

            {/* Expand button when collapsed */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                    aria-label="Expand sidebar"
                >
                    <ChevronRight size={10} className="text-muted-foreground" />
                </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                {!collapsed && (
                    <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                        Management
                    </p>
                )}
                <ul className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`
                    flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium
                    transition-all duration-150 relative group
                    ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}
                    ${collapsed ? 'justify-center' : ''}
                  `}
                                >
                                    <Icon size={16} className="flex-shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 truncate">{item.label}</span>
                                            {item.badge && (
                                                <span
                                                    className={`text-2xs font-bold px-1.5 py-0.5 rounded-full ${getBadgeClass(item.badgeVariant)}`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {collapsed && item.badge && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-2xs font-bold rounded-full bg-destructive text-white flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-muted border border-border rounded text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {!collapsed && (
                    <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-6">
                        Status
                    </p>
                )}
                {collapsed && <div className="my-4 border-t border-border" />}
                <ul className="space-y-0.5 mt-1">
                    {statusItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id}>
                                <div
                                    className={`
                    flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-default
                    ${collapsed ? 'justify-center' : ''}
                  `}
                                >
                                    <Icon size={14} className={`flex-shrink-0 ${item.color}`} />
                                    {!collapsed && (
                                        <span className="text-muted-foreground text-xs">{item.label}</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom section */}
            <div className="border-t border-border p-3 flex-shrink-0">
                {!collapsed ? (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                            <Terminal size={12} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">devoops.in</p>
                            <p className="text-2xs text-muted-foreground truncate">GoDaddy • Connected</p>
                        </div>
                        <div className="w-2 h-2 rounded-full status-dot-active flex-shrink-0" />
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Terminal size={12} className="text-primary" />
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}