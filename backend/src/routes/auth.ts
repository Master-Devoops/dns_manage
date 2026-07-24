import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  findUserByEmail,
  findUserById,
  findUserByLogin,
  registerClient,
} from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
});

function publicUser(user: {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  role: "admin" | "client";
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();

    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = await registerClient({
      email,
      password: body.password,
      fullName: body.fullName.trim(),
    });

    const token = signToken({
      id: user!.id,
      username: user!.username,
      fullName: user!.full_name,
      role: user!.role,
    });

    return res.status(201).json({
      token,
      user: publicUser(user!),
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await findUserByLogin(body.username);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid email/username or password" });
    }

    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email/username or password" });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    });

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});
