import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  deleteUser,
  findUserById,
  listUsers,
  updateUser,
} from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireAdmin);

const createSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: "Username may only contain letters, numbers, dots, underscores, and hyphens",
    })
    .optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(200),
  fullName: z.string().min(2).max(255),
  role: z.enum(["admin", "client"]).default("client"),
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  email: z.string().email().max(255).nullable().optional(),
  role: z.enum(["admin", "client"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(200).optional(),
});

function publicUser(user: {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  role: "admin" | "client";
  is_active: number;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    if (!body.username && !body.email) {
      return res.status(400).json({ error: "Username or email is required" });
    }
    const user = await createUser({
      username: body.username,
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role,
    });
    res.status(201).json({ user: publicUser(user!) });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    next(err);
  }
});

usersRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const existing = await findUserById(id);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const body = updateSchema.parse(req.body);

    if (existing.role === "admin" && body.role === "client") {
      return res.status(400).json({ error: "Cannot demote the primary admin this way" });
    }

    if (existing.id === req.user!.id && body.isActive === false) {
      return res.status(400).json({ error: "You cannot deactivate your own account" });
    }

    const user = await updateUser(id, {
      fullName: body.fullName,
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      password: body.password,
    });

    res.json({ user: publicUser(user!) });
  } catch (err) {
    next(err);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (id === req.user!.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const existing = await findUserById(id);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existing.role === "admin") {
      return res.status(400).json({ error: "Admin users cannot be deleted" });
    }

    // Reassign or block if they have records — simpler: prevent delete if records exist
    const deleted = await deleteUser(id);
    if (!deleted) {
      return res.status(400).json({ error: "Unable to delete user" });
    }

    res.json({ message: "User deleted" });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(400).json({
        error: "Cannot delete user who still owns DNS records. Reassign or delete their records first.",
      });
    }
    next(err);
  }
});
