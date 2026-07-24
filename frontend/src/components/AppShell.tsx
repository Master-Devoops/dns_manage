import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">DNS Manage</span>
        </Link>
        <nav className="topnav">
          <Link to="/">Domains</Link>
          {isAdmin ? <Link to="/users">Users</Link> : null}
        </nav>
        <div className="topbar-right">
          <span className="user-chip">
            {user?.fullName || user?.username}
            <span className="role-tag">{user?.role}</span>
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
