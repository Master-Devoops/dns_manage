import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { config } from "./config.js";

export type UserRole = "admin" | "client";

export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface DnsRecordRow {
  id: number;
  domain: string;
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority: number | null;
  port: number | null;
  weight: number | null;
  service: string | null;
  protocol: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  created_by_username?: string;
  created_by_name?: string;
  created_by_email?: string | null;
  updated_by_username?: string;
}

let pool: Pool;

export function getPool() {
  if (!pool) {
    throw new Error("Database not initialized");
  }
  return pool;
}

export async function initDatabase() {
  const bootstrap = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: true,
  });

  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await ensureColumn("users", "email", "VARCHAR(255) NULL");
  await ensureUniqueIndex("users", "users_email_unique", "email");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dns_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      domain VARCHAR(255) NOT NULL,
      type VARCHAR(16) NOT NULL,
      name VARCHAR(255) NOT NULL,
      data VARCHAR(2048) NOT NULL,
      ttl INT NOT NULL DEFAULT 3600,
      priority INT NULL,
      port INT NULL,
      weight INT NULL,
      service VARCHAR(100) NULL,
      protocol VARCHAR(50) NULL,
      created_by INT NOT NULL,
      updated_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_dns_created_by FOREIGN KEY (created_by) REFERENCES users(id),
      CONSTRAINT fk_dns_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
      INDEX idx_dns_domain (domain),
      INDEX idx_dns_created_by (created_by),
      INDEX idx_dns_lookup (domain, type, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await seedAdminUser();
  console.log(`MySQL connected: ${config.mysql.database}`);
}

async function ensureColumn(table: string, column: string, definition: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.mysql.database, table, column]
  );
  if (Number(rows[0]?.count) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureUniqueIndex(table: string, indexName: string, column: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [config.mysql.database, table, indexName]
  );
  if (Number(rows[0]?.count) === 0) {
    await pool.query(
      `ALTER TABLE \`${table}\` ADD UNIQUE INDEX \`${indexName}\` (\`${column}\`)`
    );
  }
}

async function seedAdminUser() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [config.adminUsername]
  );

  const hash = await bcrypt.hash(config.adminPassword, 10);

  if (rows.length === 0) {
    await pool.query<ResultSetHeader>(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, NULL, ?, ?, 'admin', 1)`,
      [config.adminUsername, hash, "Administrator"]
    );
    console.log(`Seeded admin user: ${config.adminUsername}`);
    return;
  }

  // Keep env admin password in sync for the seeded admin account
  await pool.query(
    `UPDATE users
     SET password_hash = ?, role = 'admin', is_active = 1, full_name = COALESCE(NULLIF(full_name, ''), 'Administrator')
     WHERE username = ?`,
    [hash, config.adminUsername]
  );
}

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const cleaned = local.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  return cleaned || "user";
}

async function uniqueUsernameFromEmail(email: string): Promise<string> {
  const base = usernameFromEmail(email);
  let candidate = base;
  let i = 1;
  while (await findUserByUsername(candidate)) {
    candidate = `${base}${i}`.slice(0, 100);
    i += 1;
  }
  return candidate;
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findUserByLogin(login: string): Promise<UserRow | null> {
  const value = login.trim();
  if (value.includes("@")) {
    return (await findUserByEmail(value)) ?? (await findUserByUsername(value));
  }
  return (await findUserByUsername(value)) ?? (await findUserByEmail(value));
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function listUsers(): Promise<Omit<UserRow, "password_hash">[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT id, username, email, full_name, role, is_active, created_at, updated_at
     FROM users
     ORDER BY role ASC, username ASC`
  );
  return rows as Omit<UserRow, "password_hash">[];
}

export async function createUser(input: {
  username?: string;
  email?: string | null;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const email = input.email?.trim().toLowerCase() || null;
  const username =
    input.username?.trim() ||
    (email ? await uniqueUsernameFromEmail(email) : `user${Date.now()}`);

  const hash = await bcrypt.hash(input.password, 10);
  const [result] = await getPool().query<ResultSetHeader>(
    `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [username, email, hash, input.fullName, input.role]
  );
  return findUserById(result.insertId);
}

export async function registerClient(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  return createUser({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    role: "client",
  });
}

export async function updateUser(
  id: number,
  input: {
    fullName?: string;
    email?: string | null;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
  }
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.fullName !== undefined) {
    fields.push("full_name = ?");
    values.push(input.fullName);
  }
  if (input.email !== undefined) {
    fields.push("email = ?");
    values.push(input.email ? input.email.trim().toLowerCase() : null);
  }
  if (input.role !== undefined) {
    fields.push("role = ?");
    values.push(input.role);
  }
  if (input.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(input.isActive ? 1 : 0);
  }
  if (input.password) {
    fields.push("password_hash = ?");
    values.push(await bcrypt.hash(input.password, 10));
  }

  if (fields.length === 0) return findUserById(id);

  values.push(id);
  await getPool().query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  return findUserById(id);
}

export async function deleteUser(id: number) {
  const [result] = await getPool().query<ResultSetHeader>(
    "DELETE FROM users WHERE id = ? AND role = 'client'",
    [id]
  );
  return result.affectedRows > 0;
}

export function matchDnsRecord(
  row: Pick<DnsRecordRow, "type" | "name" | "data" | "priority" | "port" | "weight">,
  target: {
    type: string;
    name: string;
    data: string;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
  }
) {
  return (
    row.type === target.type &&
    row.name === target.name &&
    row.data === target.data &&
    (row.priority ?? null) === (target.priority ?? null) &&
    (row.port ?? null) === (target.port ?? null) &&
    (row.weight ?? null) === (target.weight ?? null)
  );
}

export async function listDbRecords(options: {
  domain: string;
  createdBy?: number;
}): Promise<DnsRecordRow[]> {
  const params: unknown[] = [options.domain];
  let sql = `
    SELECT r.*,
           cu.username AS created_by_username,
           cu.full_name AS created_by_name,
           cu.email AS created_by_email,
           uu.username AS updated_by_username
    FROM dns_records r
    JOIN users cu ON cu.id = r.created_by
    LEFT JOIN users uu ON uu.id = r.updated_by
    WHERE r.domain = ?
  `;
  if (options.createdBy !== undefined) {
    sql += " AND r.created_by = ?";
    params.push(options.createdBy);
  }
  sql += " ORDER BY r.type ASC, r.name ASC, r.data ASC";

  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return rows as DnsRecordRow[];
}

export async function findDbRecord(options: {
  domain: string;
  type: string;
  name: string;
  data: string;
  priority?: number | null;
  port?: number | null;
  weight?: number | null;
  createdBy?: number;
}): Promise<DnsRecordRow | null> {
  const params: unknown[] = [
    options.domain,
    options.type,
    options.name,
    options.data,
  ];
  let sql = `
    SELECT r.*,
           cu.username AS created_by_username,
           cu.full_name AS created_by_name,
           cu.email AS created_by_email
    FROM dns_records r
    JOIN users cu ON cu.id = r.created_by
    WHERE r.domain = ? AND r.type = ? AND r.name = ? AND r.data = ?
  `;

  if (options.priority === undefined || options.priority === null) {
    sql += " AND r.priority IS NULL";
  } else {
    sql += " AND r.priority = ?";
    params.push(options.priority);
  }

  if (options.port === undefined || options.port === null) {
    sql += " AND r.port IS NULL";
  } else {
    sql += " AND r.port = ?";
    params.push(options.port);
  }

  if (options.weight === undefined || options.weight === null) {
    sql += " AND r.weight IS NULL";
  } else {
    sql += " AND r.weight = ?";
    params.push(options.weight);
  }

  if (options.createdBy !== undefined) {
    sql += " AND r.created_by = ?";
    params.push(options.createdBy);
  }

  sql += " LIMIT 1";
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return (rows[0] as DnsRecordRow | undefined) ?? null;
}

export async function insertDbRecord(input: {
  domain: string;
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority?: number | null;
  port?: number | null;
  weight?: number | null;
  service?: string | null;
  protocol?: string | null;
  createdBy: number;
}) {
  const [result] = await getPool().query<ResultSetHeader>(
    `INSERT INTO dns_records
      (domain, type, name, data, ttl, priority, port, weight, service, protocol, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.domain,
      input.type,
      input.name,
      input.data,
      input.ttl,
      input.priority ?? null,
      input.port ?? null,
      input.weight ?? null,
      input.service ?? null,
      input.protocol ?? null,
      input.createdBy,
      input.createdBy,
    ]
  );
  return result.insertId;
}

export async function updateDbRecord(
  id: number,
  input: {
    type: string;
    name: string;
    data: string;
    ttl: number;
    priority?: number | null;
    port?: number | null;
    weight?: number | null;
    service?: string | null;
    protocol?: string | null;
    updatedBy: number;
  }
) {
  await getPool().query(
    `UPDATE dns_records
     SET type = ?, name = ?, data = ?, ttl = ?, priority = ?, port = ?, weight = ?,
         service = ?, protocol = ?, updated_by = ?
     WHERE id = ?`,
    [
      input.type,
      input.name,
      input.data,
      input.ttl,
      input.priority ?? null,
      input.port ?? null,
      input.weight ?? null,
      input.service ?? null,
      input.protocol ?? null,
      input.updatedBy,
      id,
    ]
  );
}

export async function deleteDbRecord(id: number) {
  await getPool().query("DELETE FROM dns_records WHERE id = ?", [id]);
}
