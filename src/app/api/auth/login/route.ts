import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyAuthCookie,
  ensureDemoFarmer,
  findUserByIdentifier,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import { ensureDemoDataset } from "@/lib/demo-data";

const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100).optional(),
  identifier: z.string().min(1).max(100).optional(),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    await ensureDemoFarmer();
    await ensureDemoDataset();

    const body = await req.json();
    const parsed = userSchema.parse(body);
    const identifier = (parsed.identifier || parsed.username || "").trim();
    const password = parsed.password;

    if (!identifier) {
      return NextResponse.json({ user: null, message: "Enter your username, email, or phone number" }, { status: 400 });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { user: null, message: "No account found for that username, email, or phone number" },
        { status: 404 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ user: null, message: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json(
      { user: publicUser(user), message: "Login successful" },
      { status: 200 }
    );
    applyAuthCookie(response, user.id);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    const message =
      error?.name === "ZodError"
        ? error.issues?.[0]?.message || "Invalid login details"
        : error.message || "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
