import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DnsRecord, DnsRecordType, RecordInput } from "../api";

const TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

const emptyForm = (): RecordInput => ({
  type: "A",
  name: "",
  data: "",
  ttl: 3600,
});

function toForm(record?: DnsRecord | null): RecordInput {
  if (!record) return emptyForm();
  return {
    type: (TYPES.includes(record.type as DnsRecordType)
      ? record.type
      : "A") as DnsRecordType,
    name: record.name,
    data: record.data,
    ttl: record.ttl || 3600,
    priority: record.priority,
    port: record.port,
    weight: record.weight,
    service: record.service,
    protocol: record.protocol,
  };
}

export function RecordModal({
  open,
  mode,
  initial,
  domain,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: DnsRecord | null;
  domain: string;
  onClose: () => void;
  onSubmit: (value: RecordInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RecordInput>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(initial));
      setError(null);
      setSaving(false);
    }
  }, [open, initial]);

  const needsPriority = form.type === "MX" || form.type === "SRV";
  const hint = useMemo(() => {
    switch (form.type) {
      case "A":
        return "Point a host to an IPv4 address, e.g. 203.0.113.10";
      case "AAAA":
        return "Point a host to an IPv6 address";
      case "CNAME":
        return "Alias this name to another hostname";
      case "MX":
        return "Mail exchange — include priority (lower is preferred)";
      case "TXT":
        return "Verification / SPF / DKIM text values";
      case "NS":
        return "Nameserver delegation for a subdomain";
      case "SRV":
        return "Service location — priority, weight, and port required";
      case "CAA":
        return "Certificate Authority Authorization";
      default:
        return "";
    }
  }, [form.type]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.data.trim()) {
      setError("Name and value are required");
      return;
    }
    if (needsPriority && form.priority === undefined) {
      setError("Priority is required for this record type");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        data: form.data.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="record-modal-title">
              {mode === "create" ? "Add DNS record" : "Edit DNS record"}
            </h2>
            <p className="muted">{domain}</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="modal-body" onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-grid">
            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as DnsRecordType }))
                }
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Name / Host
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="@, www, api, mail…"
                required
              />
            </label>

            <label className="span-2">
              Value / Points to
              <input
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                placeholder={
                  form.type === "CNAME" ? "target.example.com" : "203.0.113.10"
                }
                required
              />
            </label>

            <label>
              TTL (seconds)
              <input
                type="number"
                min={600}
                max={604800}
                value={form.ttl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ttl: Number(e.target.value) || 3600 }))
                }
              />
            </label>

            {needsPriority ? (
              <label>
                Priority
                <input
                  type="number"
                  min={0}
                  max={65535}
                  value={form.priority ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
            ) : (
              <div />
            )}

            {form.type === "SRV" ? (
              <>
                <label>
                  Port
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={form.port ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        port:
                          e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Weight
                  <input
                    type="number"
                    min={0}
                    max={65535}
                    value={form.weight ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        weight:
                          e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </>
            ) : null}
          </div>

          <p className="field-hint">{hint}</p>
          {error ? <div className="alert alert-error">{error}</div> : null}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : mode === "create" ? "Create record" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
