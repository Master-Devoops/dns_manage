import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { RecordModal } from "../components/RecordModal";
import { useAuth } from "../auth";
import { client, type DnsRecord, type RecordInput } from "../api";

export function DomainRecordsPage() {
  const { domain = "" } = useParams();
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DnsRecord | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.listRecords(domain);
      setRecords(res.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (domain) void load();
  }, [domain]);

  const types = useMemo(() => {
    const set = new Set(records.map((r) => r.type));
    return ["ALL", ...Array.from(set).sort()];
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!q) return true;
        const creator =
        `${r.createdBy?.fullName ?? ""} ${r.createdBy?.username ?? ""} ${r.createdBy?.email ?? ""}`.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.data.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        creator.includes(q)
      );
    });
  }, [records, query, typeFilter]);

  function recordId(r: DnsRecord) {
    return `${r.id ?? "x"}:${r.type}:${r.name}:${r.data}:${r.priority ?? ""}:${r.port ?? ""}`;
  }

  async function handleCreate(value: RecordInput) {
    await client.createRecord(domain, value);
    await load();
  }

  async function handleUpdate(value: RecordInput) {
    if (!editing) return;
    await client.updateRecord(
      domain,
      {
        type: editing.type,
        name: editing.name,
        data: editing.data,
        ttl: editing.ttl,
        priority: editing.priority,
        port: editing.port,
        weight: editing.weight,
      },
      value
    );
    await load();
  }

  async function handleDelete(record: DnsRecord) {
    const label = `${record.type} ${record.name} → ${record.data}`;
    if (!window.confirm(`Delete this DNS record?\n\n${label}`)) return;

    const key = recordId(record);
    setBusyKey(key);
    setError(null);
    try {
      await client.deleteRecord(domain, {
        type: record.type,
        name: record.name,
        data: record.data,
        priority: record.priority,
        port: record.port,
        weight: record.weight,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyKey(null);
    }
  }

  const colSpan = isAdmin ? 7 : 6;

  return (
    <AppShell
      title={domain}
      subtitle={
        isAdmin
          ? "All DNS records. Creator shows who added the record from this app."
          : "Only the DNS records you have added are listed here."
      }
      actions={
        <>
          <Link to="/" className="btn btn-ghost">
            ← Domains
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add record
          </button>
        </>
      }
    >
      <div className="toolbar">
        <input
          className="search"
          placeholder={
            isAdmin
              ? "Search name, value, type, or creator…"
              : "Search name, value, or type…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All types" : t}
            </option>
          ))}
        </select>
        <span className="count-pill">
          {filtered.length} / {records.length} records
        </span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <div className="panel empty">
          <div className="spinner" />
          <p>Loading DNS records…</p>
        </div>
      ) : (
        <div className="table-wrap panel">
          <table className="records-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Value</th>
                <th>TTL</th>
                <th>Priority</th>
                {isAdmin ? <th>Created by</th> : null}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="empty-row">
                    {isAdmin
                      ? "No records match your filters."
                      : "You have not added any records yet. Click Add record to create one."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const key = recordId(r);
                  return (
                    <tr key={key}>
                      <td>
                        <span className={`type-badge type-${r.type}`}>{r.type}</span>
                      </td>
                      <td className="mono">{r.name}</td>
                      <td className="mono value-cell" title={r.data}>
                        {r.data}
                      </td>
                      <td>{r.ttl}</td>
                      <td>{r.priority ?? "—"}</td>
                      {isAdmin ? (
                        <td>
                          {r.createdBy ? (
                            <div className="creator-cell">
                              <strong>{r.createdBy.fullName || r.createdBy.username}</strong>
                              {r.createdBy.email ? (
                                <span className="muted mono">{r.createdBy.email}</span>
                              ) : (
                                <span className="muted mono">@{r.createdBy.username}</span>
                              )}
                            </div>
                          ) : (
                            <span className="muted">GoDaddy / untracked</span>
                          )}
                        </td>
                      ) : null}
                      <td className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditing(r);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={busyKey === key}
                          onClick={() => void handleDelete(r)}
                        >
                          {busyKey === key ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <RecordModal
        open={modalOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        domain={domain}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </AppShell>
  );
}
