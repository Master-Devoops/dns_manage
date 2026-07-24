import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import type { GoDaddyClient, DnsRecord } from "../godaddy.js";
import {
  deleteDbRecord,
  insertDbRecord,
  listDbRecords,
  updateDbRecord,
  type DnsRecordRow,
} from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SRV",
  "CAA",
] as const;

const recordInputSchema = z.object({
  type: z.enum(RECORD_TYPES),
  name: z.string().min(1).max(255),
  data: z.string().min(1).max(2048),
  ttl: z.coerce.number().int().min(600).max(604800).default(3600),
  priority: z.coerce.number().int().min(0).max(65535).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  weight: z.coerce.number().int().min(0).max(65535).optional(),
  service: z.string().optional(),
  protocol: z.string().optional(),
});

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function assertDomainAllowed(domain: string) {
  if (
    config.managedDomains.length > 0 &&
    !config.managedDomains.includes(domain.toLowerCase())
  ) {
    throw new HttpError(403, "Domain is not in the managed domains list");
  }
}

function normalizeRecordName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "@" || trimmed === "") return "@";
  return trimmed.replace(/\.$/, "");
}

function toGoDaddyPayload(record: z.infer<typeof recordInputSchema>): DnsRecord {
  const payload: DnsRecord = {
    type: record.type,
    name: normalizeRecordName(record.name),
    data: record.data.trim(),
    ttl: record.ttl,
  };

  if (record.type === "MX" || record.type === "SRV") {
    payload.priority = record.priority ?? 0;
  }
  if (record.type === "SRV") {
    if (record.port !== undefined) payload.port = record.port;
    if (record.weight !== undefined) payload.weight = record.weight;
    if (record.service) payload.service = record.service;
    if (record.protocol) payload.protocol = record.protocol;
  }

  return payload;
}

function recordKey(record: DnsRecord): string {
  return `${record.type}|${record.name}|${record.data}|${record.ttl}|${record.priority ?? ""}|${record.port ?? ""}|${record.weight ?? ""}`;
}

/** Normalize values so DB ↔ GoDaddy matching is reliable (IP zeros, case, trailing dots). */
function normalizeData(type: string, data: string): string {
  const raw = data.trim();
  if (type === "A") {
    const parts = raw.split(".");
    if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
      return parts.map((p) => String(Number(p))).join(".");
    }
  }
  if (type === "AAAA") {
    // Collapse trivial formatting differences; keep lowercase
    return raw.toLowerCase();
  }
  if (type === "CNAME" || type === "MX" || type === "NS") {
    return raw.replace(/\.$/, "").toLowerCase();
  }
  if (type === "TXT") {
    return raw;
  }
  return raw;
}

function normalizeName(name: string, domain?: string): string {
  let n = name.trim().replace(/\.$/, "");
  if (domain) {
    const suffix = `.${domain.toLowerCase()}`;
    const lower = n.toLowerCase();
    if (lower === domain.toLowerCase()) return "@";
    if (lower.endsWith(suffix)) {
      n = n.slice(0, -suffix.length);
    }
  }
  return n === "" ? "@" : n;
}

function identityKey(
  record: {
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
  },
  domain?: string
) {
  const type = String(record.type).toUpperCase();
  return [
    type,
    normalizeName(record.name, domain).toLowerCase(),
    normalizeData(type, record.data),
    record.priority ?? "",
    record.port ?? "",
    record.weight ?? "",
  ].join("|");
}

function findMetaForLive(
  live: DnsRecord,
  dbRecords: DnsRecordRow[],
  domain: string
): DnsRecordRow | undefined {
  const key = identityKey(live, domain);
  return dbRecords.find((r) => identityKey(r, domain) === key);
}

function sameIdentity(
  a: {
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
  },
  b: {
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
  },
  domain: string
) {
  return identityKey(a, domain) === identityKey(b, domain);
}

async function findOwnedDbRecord(
  domain: string,
  target: {
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
  },
  createdBy?: number
) {
  const rows = await listDbRecords({ domain, createdBy });
  return (
    rows.find((r) =>
      sameIdentity(
        r,
        {
          type: target.type,
          name: target.name,
          data: target.data,
          priority: target.priority ?? null,
          port: target.port ?? null,
          weight: target.weight ?? null,
        },
        domain
      )
    ) ?? null
  );
}

function dbRowToApi(row: DnsRecordRow) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    data: row.data,
    ttl: row.ttl,
    priority: row.priority ?? undefined,
    port: row.port ?? undefined,
    weight: row.weight ?? undefined,
    service: row.service ?? undefined,
    protocol: row.protocol ?? undefined,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
      fullName: row.created_by_name,
      email: row.created_by_email ?? null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createDomainsRouter(godaddy: GoDaddyClient) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (_req, res, next) => {
    try {
      let domains = await godaddy.listDomains();
      if (config.managedDomains.length > 0) {
        const allowed = new Set(config.managedDomains);
        domains = domains.filter((d) => allowed.has(d.domain.toLowerCase()));
      }
      res.json({ domains });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:domain", async (req, res, next) => {
    try {
      const domain = String(req.params.domain).toLowerCase();
      assertDomainAllowed(domain);
      const info = await godaddy.getDomain(domain);
      res.json({ domain: info });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:domain/records", async (req, res, next) => {
    try {
      const domain = String(req.params.domain).toLowerCase();
      assertDomainAllowed(domain);
      const user = req.user!;
      const isAdmin = user.role === "admin";

      const dbRecords = await listDbRecords({
        domain,
        createdBy: isAdmin ? undefined : user.id,
      });

      if (!isAdmin) {
        const records = dbRecords.map(dbRowToApi);
        return res.json({
          domain,
          records,
          count: records.length,
          scope: "own",
        });
      }

      // Admin: GoDaddy live records + creator info from DB
      const live = await godaddy.listRecords(domain);

      const records = live
        .map((r) => {
          const meta = findMetaForLive(r, dbRecords, domain);
          return {
            id: meta?.id,
            type: r.type,
            name: r.name,
            data: r.data,
            ttl: r.ttl,
            priority: r.priority,
            port: r.port,
            weight: r.weight,
            service: r.service,
            protocol: r.protocol,
            createdBy: meta
              ? {
                  id: meta.created_by,
                  username: meta.created_by_username,
                  fullName: meta.created_by_name,
                  email: meta.created_by_email ?? null,
                }
              : null,
            createdAt: meta?.created_at ?? null,
            updatedAt: meta?.updated_at ?? null,
            tracked: Boolean(meta),
          };
        })
        .sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return a.data.localeCompare(b.data);
        });

      res.json({
        domain,
        records,
        count: records.length,
        scope: "all",
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:domain/records", async (req, res, next) => {
    try {
      const domain = String(req.params.domain).toLowerCase();
      assertDomainAllowed(domain);
      const user = req.user!;

      const input = recordInputSchema.parse(req.body);
      if ((input.type === "MX" || input.type === "SRV") && input.priority === undefined) {
        return res.status(400).json({ error: "Priority is required for MX and SRV records" });
      }

      const payload = toGoDaddyPayload(input);
      // Store canonical values so admin matching works (e.g. 198.204.56.04 → 198.204.56.4)
      payload.data = normalizeData(String(payload.type), payload.data);
      payload.name = normalizeName(payload.name, domain);

      await godaddy.addRecords(domain, [payload]);

      // Prefer what GoDaddy actually stored
      const liveAfter = await godaddy.listRecords(domain, payload.type, payload.name);
      const matchedLive =
        liveAfter.find(
          (r) =>
            identityKey(r, domain) === identityKey(payload, domain)
        ) ?? liveAfter[liveAfter.length - 1];

      const toSave = matchedLive
        ? {
            type: String(matchedLive.type),
            name: normalizeName(matchedLive.name, domain),
            data: normalizeData(String(matchedLive.type), matchedLive.data),
            ttl: matchedLive.ttl,
            priority: matchedLive.priority ?? null,
            port: matchedLive.port ?? null,
            weight: matchedLive.weight ?? null,
            service: matchedLive.service ?? null,
            protocol: matchedLive.protocol ?? null,
          }
        : {
            type: String(payload.type),
            name: payload.name,
            data: payload.data,
            ttl: payload.ttl,
            priority: payload.priority ?? null,
            port: payload.port ?? null,
            weight: payload.weight ?? null,
            service: payload.service ?? null,
            protocol: payload.protocol ?? null,
          };

      const recordId = await insertDbRecord({
        domain,
        ...toSave,
        createdBy: user.id,
      });

      const saved = await findOwnedDbRecord(domain, {
        type: toSave.type,
        name: toSave.name,
        data: toSave.data,
        priority: toSave.priority,
        port: toSave.port,
        weight: toSave.weight,
      });

      res.status(201).json({
        message: "Record created",
        record: saved ? dbRowToApi(saved) : { id: recordId, ...toSave },
      });
    } catch (err) {
      next(err);
    }
  });

  router.put("/:domain/records", async (req, res, next) => {
    try {
      const domain = String(req.params.domain).toLowerCase();
      assertDomainAllowed(domain);
      const user = req.user!;
      const isAdmin = user.role === "admin";

      const schema = z.object({
        original: z.object({
          type: z.enum(RECORD_TYPES),
          name: z.string().min(1),
          data: z.string().min(1),
          ttl: z.coerce.number().int().optional(),
          priority: z.coerce.number().int().optional(),
          port: z.coerce.number().int().optional(),
          weight: z.coerce.number().int().optional(),
        }),
        updated: recordInputSchema,
      });

      const { original, updated } = schema.parse(req.body);

      if (
        (updated.type === "MX" || updated.type === "SRV") &&
        updated.priority === undefined
      ) {
        return res.status(400).json({ error: "Priority is required for MX and SRV records" });
      }

      const originalName = normalizeName(original.name, domain);
      const existingDb = await findOwnedDbRecord(
        domain,
        {
          type: original.type,
          name: originalName,
          data: original.data,
          priority: original.priority ?? null,
          port: original.port ?? null,
          weight: original.weight ?? null,
        },
        isAdmin ? undefined : user.id
      );

      if (!isAdmin && !existingDb) {
        return res.status(403).json({ error: "You can only edit records you created" });
      }

      const updatedPayload = toGoDaddyPayload(updated);
      updatedPayload.data = normalizeData(String(updatedPayload.type), updatedPayload.data);
      updatedPayload.name = normalizeName(updatedPayload.name, domain);
      const typeChanged = original.type !== updated.type;
      const nameChanged = originalName !== updatedPayload.name;

      if (typeChanged || nameChanged) {
        const existingAtTarget = await godaddy.listRecords(
          domain,
          updatedPayload.type,
          updatedPayload.name
        );
        await godaddy.replaceRecordsByTypeAndName(
          domain,
          updatedPayload.type,
          updatedPayload.name,
          [...existingAtTarget, updatedPayload]
        );

        const siblings = await godaddy.listRecords(domain, original.type, originalName);
        const remaining = siblings.filter(
          (r) =>
            !sameIdentity(
              r,
              {
                type: original.type,
                name: originalName,
                data: original.data,
                priority: original.priority ?? null,
                port: original.port ?? null,
                weight: original.weight ?? null,
              },
              domain
            )
        );

        if (remaining.length === 0) {
          await godaddy.deleteRecordsByTypeAndName(domain, original.type, originalName);
        } else {
          await godaddy.replaceRecordsByTypeAndName(
            domain,
            original.type,
            originalName,
            remaining
          );
        }
      } else {
        const siblings = await godaddy.listRecords(domain, original.type, originalName);
        const nextRecords = siblings.map((r) => {
          const matches = sameIdentity(
            r,
            {
              type: original.type,
              name: originalName,
              data: original.data,
              priority: original.priority ?? null,
              port: original.port ?? null,
              weight: original.weight ?? null,
            },
            domain
          );
          return matches ? updatedPayload : r;
        });

        const found = siblings.some((r) =>
          sameIdentity(
            r,
            {
              type: original.type,
              name: originalName,
              data: original.data,
              priority: original.priority ?? null,
              port: original.port ?? null,
              weight: original.weight ?? null,
            },
            domain
          )
        );
        if (!found) {
          nextRecords.push(updatedPayload);
        }

        const unique = Array.from(
          new Map(nextRecords.map((r) => [recordKey(r), r] as const)).values()
        );

        await godaddy.replaceRecordsByTypeAndName(
          domain,
          updatedPayload.type,
          updatedPayload.name,
          unique
        );
      }

      if (existingDb) {
        await updateDbRecord(existingDb.id, {
          type: String(updatedPayload.type),
          name: updatedPayload.name,
          data: updatedPayload.data,
          ttl: updatedPayload.ttl,
          priority: updatedPayload.priority ?? null,
          port: updatedPayload.port ?? null,
          weight: updatedPayload.weight ?? null,
          service: updatedPayload.service ?? null,
          protocol: updatedPayload.protocol ?? null,
          updatedBy: user.id,
        });
      } else if (isAdmin) {
        await insertDbRecord({
          domain,
          type: String(updatedPayload.type),
          name: updatedPayload.name,
          data: updatedPayload.data,
          ttl: updatedPayload.ttl,
          priority: updatedPayload.priority ?? null,
          port: updatedPayload.port ?? null,
          weight: updatedPayload.weight ?? null,
          service: updatedPayload.service ?? null,
          protocol: updatedPayload.protocol ?? null,
          createdBy: user.id,
        });
      }

      const owned = await findOwnedDbRecord(domain, {
        type: String(updatedPayload.type),
        name: updatedPayload.name,
        data: updatedPayload.data,
        priority: updatedPayload.priority ?? null,
        port: updatedPayload.port ?? null,
        weight: updatedPayload.weight ?? null,
      });

      res.json({
        message: "Record updated",
        record: owned ? dbRowToApi(owned) : updatedPayload,
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:domain/records", async (req, res, next) => {
    try {
      const domain = String(req.params.domain).toLowerCase();
      assertDomainAllowed(domain);
      const user = req.user!;
      const isAdmin = user.role === "admin";

      const schema = z.object({
        type: z.enum(RECORD_TYPES),
        name: z.string().min(1),
        data: z.string().min(1),
        priority: z.coerce.number().int().optional(),
        port: z.coerce.number().int().optional(),
        weight: z.coerce.number().int().optional(),
      });

      const target = schema.parse(req.body);
      const name = normalizeName(target.name, domain);

      const existingDb = await findOwnedDbRecord(
        domain,
        {
          type: target.type,
          name,
          data: target.data,
          priority: target.priority ?? null,
          port: target.port ?? null,
          weight: target.weight ?? null,
        },
        isAdmin ? undefined : user.id
      );

      if (!isAdmin && !existingDb) {
        return res.status(403).json({ error: "You can only delete records you created" });
      }

      const siblings = await godaddy.listRecords(domain, target.type, name);

      const remaining = siblings.filter(
        (r) =>
          !sameIdentity(
            r,
            {
              type: target.type,
              name,
              data: target.data,
              priority: target.priority ?? null,
              port: target.port ?? null,
              weight: target.weight ?? null,
            },
            domain
          )
      );

      if (remaining.length === siblings.length && !existingDb) {
        return res.status(404).json({ error: "Record not found" });
      }

      if (remaining.length < siblings.length) {
        if (remaining.length === 0) {
          await godaddy.deleteRecordsByTypeAndName(domain, target.type, name);
        } else {
          await godaddy.replaceRecordsByTypeAndName(
            domain,
            target.type,
            name,
            remaining
          );
        }
      }

      if (existingDb) {
        await deleteDbRecord(existingDb.id);
      }

      res.json({ message: "Record deleted" });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
