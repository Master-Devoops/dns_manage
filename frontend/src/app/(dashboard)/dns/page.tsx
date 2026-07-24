"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function DnsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRecords = () => {
    setLoading(true);
    api.get(`/dns?search=${search}`)
      .then(res => setRecords(res.data.items))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(fetchRecords, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/dns/${id}`);
      fetchRecords();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">DNS Records</h2>
          <p className="text-muted-foreground">Manage your subdomains and DNS routing.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search records..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subdomain</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Value</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">TTL</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Updated</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {record.type}
                        </span>
                      </td>
                      <td className="p-4 align-middle font-medium">{record.subdomain}</td>
                      <td className="p-4 align-middle font-mono text-xs">{record.data}</td>
                      <td className="p-4 align-middle">{record.ttl}s</td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {format(new Date(record.updatedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4 align-middle text-right space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
