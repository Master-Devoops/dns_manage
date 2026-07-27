export type UserRole = "admin" | "client";

export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA";

export interface AuthUser {
  id: number;
  username: string;
  email?: string | null;
  fullName: string;
  role: UserRole;
}

export interface ManagedUser {
  id: number;
  username: string;
  email?: string | null;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DnsRecord {
  id?: number;
  type: DnsRecordType | string;
  name: string;
  data: string;
  ttl: number;
  priority?: number;
  port?: number;
  weight?: number;
  service?: string;
  protocol?: string;
  createdBy?: {
    id: number;
    username?: string;
    fullName?: string;
    email?: string | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tracked?: boolean;
}

export interface DomainSummary {
  domain: string;
  status: string;
  expires?: string;
  renewAuto?: boolean;
  nameServers?: string[];
}

export interface RecordInput {
  type: DnsRecordType;
  name: string;
  data: string;
  ttl: number;
  priority?: number;
  port?: number;
  weight?: number;
  service?: string;
  protocol?: string;
}

const TOKEN_KEY = "dns_manage_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const API_BASE = "https://dns-api.devoops.in";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export const client = {
  login(username: string, password: string) {
    return api<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  register(input: { fullName: string; email: string; password: string }) {
    return api<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  me() {
    return api<{ user: AuthUser }>("/api/auth/me");
  },
  listUsers() {
    return api<{ users: ManagedUser[] }>("/api/users");
  },
  createUser(input: {
    username?: string;
    email?: string;
    password: string;
    fullName: string;
    role?: UserRole;
  }) {
    return api<{ user: ManagedUser }>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateUser(
    id: number,
    input: {
      fullName?: string;
      email?: string | null;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    }
  ) {
    return api<{ user: ManagedUser }>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  deleteUser(id: number) {
    return api<{ message: string }>(`/api/users/${id}`, { method: "DELETE" });
  },
  listDomains() {
    return api<{ domains: DomainSummary[] }>("/api/domains");
  },
  getDomain(domain: string) {
    return api<{ domain: DomainSummary }>(`/api/domains/${encodeURIComponent(domain)}`);
  },
  listRecords(domain: string) {
    return api<{
      domain: string;
      records: DnsRecord[];
      count: number;
      scope: "all" | "own";
    }>(`/api/domains/${encodeURIComponent(domain)}/records`);
  },
  createRecord(domain: string, record: RecordInput) {
    return api<{ message: string; record: DnsRecord }>(
      `/api/domains/${encodeURIComponent(domain)}/records`,
      { method: "POST", body: JSON.stringify(record) }
    );
  },
  updateRecord(
    domain: string,
    original: Partial<DnsRecord> & Pick<DnsRecord, "type" | "name" | "data">,
    updated: RecordInput
  ) {
    return api<{ message: string; record: DnsRecord }>(
      `/api/domains/${encodeURIComponent(domain)}/records`,
      {
        method: "PUT",
        body: JSON.stringify({ original, updated }),
      }
    );
  },
  deleteRecord(
    domain: string,
    record: Pick<DnsRecord, "type" | "name" | "data"> &
      Partial<Pick<DnsRecord, "priority" | "port" | "weight">>
  ) {
    return api<{ message: string }>(
      `/api/domains/${encodeURIComponent(domain)}/records`,
      { method: "DELETE", body: JSON.stringify(record) }
    );
  },
};
