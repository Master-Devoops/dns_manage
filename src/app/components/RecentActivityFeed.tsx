import React from 'react';
import { Plus, Edit2, Trash2, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'sync' | 'alert' | 'ssl';
  message: string;
  detail: string;
  time: string;
  actor: string;
}

const activities: ActivityItem[] = [
  { id: 'act-001', type: 'sync', message: 'GoDaddy sync completed', detail: '14 records refreshed for devoops.in', time: '2 min ago', actor: 'API' },
  { id: 'act-002', type: 'alert', message: 'Health check failed', detail: 'api.devoops.in returned HTTP 502 (3 consecutive)', time: '8 min ago', actor: 'Monitor' },
  { id: 'act-003', type: 'create', message: 'A record created', detail: 'grafana.devoops.in → 165.22.214.94', time: '1h ago', actor: 'Rahul Sharma' },
  { id: 'act-004', type: 'ssl', message: 'SSL expiry warning', detail: 'api.devoops.in cert expires in 6 days', time: '3h ago', actor: 'Monitor' },
  { id: 'act-005', type: 'update', message: 'CNAME record updated', detail: 'cdn.devoops.in → cdn.cloudflare.net (TTL: 300)', time: '5h ago', actor: 'Priya Nair' },
  { id: 'act-006', type: 'delete', message: 'TXT record deleted', detail: 'v=spf1 include:old-provider.com ~all', time: '7h ago', actor: 'Rahul Sharma' },
];

const typeConfig = {
  create: { Icon: Plus, color: 'text-accent', bg: 'bg-accent/10' },
  update: { Icon: Edit2, color: 'text-primary', bg: 'bg-primary/10' },
  delete: { Icon: Trash2, color: 'text-destructive', bg: 'bg-destructive/10' },
  sync: { Icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
  alert: { Icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ssl: { Icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10' },
};

export default function RecentActivityFeed() {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">DNS changes and health events</p>
        </div>
        <button className="btn-ghost text-xs px-2.5 py-1">View all</button>
      </div>

      <div className="space-y-0">
        {activities.map((item, idx) => {
          const { Icon, color, bg } = typeConfig[item.type];
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 py-3 ${idx < activities.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                <Icon size={13} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{item.message}</p>
                  <span className="text-2xs text-muted-foreground flex-shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{item.detail}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">by {item.actor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}