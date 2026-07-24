import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../auth";
import { client, type DomainSummary } from "../api";

export function DomainsPage() {
  const { isAdmin } = useAuth();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.listDomains();
      setDomains(res.domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load domains");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell
      title="Domains"
      subtitle={
        isAdmin
          ? "All domains. Open any domain to see every DNS record and who created it."
          : "Open a domain to add records. You will only see records you create."
      }
      actions={
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Refresh
        </button>
      }
    >
      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <div className="panel empty">
          <div className="spinner" />
          <p>Loading domains…</p>
        </div>
      ) : domains.length === 0 ? (
        <div className="panel empty">
          <h2>No domains found</h2>
          <p className="muted">
            Check your GoDaddy API keys, or set <code>MANAGED_DOMAINS</code> in the backend
            environment.
          </p>
        </div>
      ) : (
        <div className="domain-grid">
          {domains.map((d) => (
            <Link key={d.domain} to={`/domains/${d.domain}`} className="domain-card">
              <div className="domain-card-top">
                <h2>{d.domain}</h2>
                <span className={`status status-${d.status.toLowerCase()}`}>{d.status}</span>
              </div>
              <dl className="meta-list">
                <div>
                  <dt>Expires</dt>
                  <dd>
                    {d.expires
                      ? new Date(d.expires).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Auto-renew</dt>
                  <dd>{d.renewAuto ? "On" : "Off"}</dd>
                </div>
              </dl>
              <span className="domain-cta">Manage DNS →</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
