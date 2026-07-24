import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../components/AppShell";
import { client, type ManagedUser, type UserRole } from "../api";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  role: "client" as UserRole,
};

export function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resetPassword, setResetPassword] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.listUsers();
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.email.trim() && !form.username.trim()) {
      setError("Email or username is required");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await client.createUser({
        ...form,
        username: form.username.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setForm(emptyForm);
      setSuccess(`User "${form.fullName}" created`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    setError(null);
    try {
      await client.updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function savePassword(user: ManagedUser) {
    const password = resetPassword[user.id]?.trim();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError(null);
    try {
      await client.updateUser(user.id, { password });
      setResetPassword((prev) => ({ ...prev, [user.id]: "" }));
      setSuccess(`Password updated for ${user.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    }
  }

  async function removeUser(user: ManagedUser) {
    if (!window.confirm(`Delete client "${user.username}"?`)) return;
    setError(null);
    try {
      await client.deleteUser(user.id);
      setSuccess(`Deleted ${user.username}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AppShell
      title="Users"
      subtitle="Create client accounts. Clients only see DNS records they add."
      actions={
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Refresh
        </button>
      }
    >
      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <section className="panel form-panel">
        <h2>Create client</h2>
        <form className="form-grid" onSubmit={(e) => void onCreate(e)}>
          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              placeholder="Rahul Sharma"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="rahul@example.com"
            />
          </label>
          <label>
            Username (optional)
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="rahul"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="span-2 form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <div className="panel empty">
          <div className="spinner" />
          <p>Loading users…</p>
        </div>
      ) : (
        <div className="table-wrap panel">
          <table className="records-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Reset password</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td className="mono">{u.email || "—"}</td>
                  <td className="mono">{u.username}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={u.isActive ? "status status-active" : "status status-off"}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="inline-reset">
                      <input
                        type="password"
                        placeholder="New password"
                        value={resetPassword[u.id] ?? ""}
                        onChange={(e) =>
                          setResetPassword((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void savePassword(u)}
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void toggleActive(u)}
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                    {u.role === "client" ? (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void removeUser(u)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
