export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA";

export interface DnsRecord {
  type: DnsRecordType | string;
  name: string;
  data: string;
  ttl: number;
  priority?: number;
  port?: number;
  service?: string;
  protocol?: string;
  weight?: number;
}

export interface DomainSummary {
  domain: string;
  status: string;
  expires?: string;
  renewAuto?: boolean;
  nameServers?: string[];
}

export class GoDaddyError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "GoDaddyError";
    this.status = status;
    this.body = body;
  }
}

export class GoDaddyClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly apiSecret: string
  ) {}

  private authHeader() {
    return `sso-key ${this.apiKey}:${this.apiSecret}`;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: this.authHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message: unknown }).message === "string"
          ? (body as { message: string }).message
          : `GoDaddy API error (${response.status})`;
      throw new GoDaddyError(message, response.status, body);
    }

    return body as T;
  }

  async listDomains(): Promise<DomainSummary[]> {
    const domains = await this.request<
      Array<{
        domain: string;
        status: string;
        expires?: string;
        renewAuto?: boolean;
        nameServers?: string[];
      }>
    >("/domains?statuses=ACTIVE&limit=100");

    return domains.map((d) => ({
      domain: d.domain,
      status: d.status,
      expires: d.expires,
      renewAuto: d.renewAuto,
      nameServers: d.nameServers,
    }));
  }

  async getDomain(domain: string): Promise<DomainSummary> {
    const d = await this.request<{
      domain: string;
      status: string;
      expires?: string;
      renewAuto?: boolean;
      nameServers?: string[];
    }>(`/domains/${encodeURIComponent(domain)}`);

    return {
      domain: d.domain,
      status: d.status,
      expires: d.expires,
      renewAuto: d.renewAuto,
      nameServers: d.nameServers,
    };
  }

  async listRecords(domain: string, type?: string, name?: string): Promise<DnsRecord[]> {
    let path = `/domains/${encodeURIComponent(domain)}/records`;
    if (type) {
      path += `/${encodeURIComponent(type)}`;
      if (name) {
        path += `/${encodeURIComponent(name)}`;
      }
    }
    return this.request<DnsRecord[]>(path);
  }

  async addRecords(domain: string, records: DnsRecord[]): Promise<void> {
    await this.request(`/domains/${encodeURIComponent(domain)}/records`, {
      method: "PATCH",
      body: JSON.stringify(records),
    });
  }

  async replaceRecordsByTypeAndName(
    domain: string,
    type: string,
    name: string,
    records: DnsRecord[]
  ): Promise<void> {
    await this.request(
      `/domains/${encodeURIComponent(domain)}/records/${encodeURIComponent(type)}/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        body: JSON.stringify(records),
      }
    );
  }

  async deleteRecordsByTypeAndName(
    domain: string,
    type: string,
    name: string
  ): Promise<void> {
    await this.request(
      `/domains/${encodeURIComponent(domain)}/records/${encodeURIComponent(type)}/${encodeURIComponent(name)}`,
      { method: "DELETE" }
    );
  }
}
