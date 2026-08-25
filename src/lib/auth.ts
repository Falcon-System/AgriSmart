import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const DEMO_LOGIN = {
  username: "farmer",
  password: "FarmDemo123",
  email: "abebe@agrismart.demo",
  firstName: "Abebe",
  lastName: "Tadesse",
  phoneNumber: "251911000001",
  organization: "Hawassa Cassava Cooperative",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export async function findUserByIdentifier(identifier: string) {
  const value = identifier.trim();
  if (!value) return null;

  const lookups = [
    ["username", value],
    ["username", value.toLowerCase()],
    ["email", value.toLowerCase()],
  ] as const;

  for (const [column, match] of lookups) {
    const { data } = await db.from("User").select("*").eq(column, match).single();
    if (data) return data;
  }

  const phone = digitsOnly(value);
  if (phone.length >= 10) {
    const { data } = await db.from("User").select("*").eq("phoneNumber", phone).single();
    if (data) return data;
    const { data: raw } = await db.from("User").select("*").eq("phoneNumber", value).single();
    if (raw) return raw;
  }

  return null;
}

export async function ensureDemoFarmer() {
  const existing = await findUserByIdentifier(DEMO_LOGIN.username);
  const hashedPassword = await hash(DEMO_LOGIN.password, 10);
  if (existing) {
    if (existing.isDemo) {
      await db.from("User").update({ password: hashedPassword, isDemo: true }).eq("id", existing.id);
      return { ...existing, password: hashedPassword };
    }
    return existing;
  }

  const { data, error } = await db
    .from("User")
    .insert({
      id: crypto.randomUUID(),
      username: DEMO_LOGIN.username,
      email: DEMO_LOGIN.email,
      firstName: DEMO_LOGIN.firstName,
      lastName: DEMO_LOGIN.lastName,
      phoneNumber: DEMO_LOGIN.phoneNumber,
      organization: DEMO_LOGIN.organization,
      password: hashedPassword,
      isDemo: true,
    })
    .select()
    .single();

  if (error || !data) {
    return findUserByIdentifier(DEMO_LOGIN.username);
  }
  return data;
}

export async function verifyPassword(password: string, hashed?: string | null) {
  if (!hashed) return false;
  return compare(password, hashed);
}

export function applyAuthCookie(response: NextResponse, userId: string) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return token;
}

export function publicUser(user: Record<string, any>) {
  const { password, ...rest } = user;
  return rest;
}
