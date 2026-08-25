import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { db } from "@/lib/db";
import { applyAuthCookie, findUserByIdentifier, publicUser } from "@/lib/auth";

const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  lastName: z.string().min(1, "Last name is required").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  phoneNumber: z.string().min(1, "Phone number is required").max(100),
  organization: z.string().optional(),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, firstName, lastName, phoneNumber, organization, password } = userSchema.parse(body);
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    if (await findUserByIdentifier(normalizedUsername)) {
      return NextResponse.json({ user: null, message: "User with this username already exists" }, { status: 409 });
    }
    if (await findUserByIdentifier(normalizedEmail)) {
      return NextResponse.json({ user: null, message: "User with this email already exists" }, { status: 409 });
    }
    if (await findUserByIdentifier(normalizedPhone)) {
      return NextResponse.json({ user: null, message: "User with this phone number already exists" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);
    const { data: newUser, error: createError } = await db
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        username: normalizedUsername,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: normalizedPhone,
        organization,
        password: hashedPassword,
      })
      .select()
      .single();

    if (createError || !newUser) {
      throw createError || new Error("Could not create account");
    }

    const response = NextResponse.json(
      { user: publicUser(newUser), message: "User created successfully" },
      { status: 201 }
    );
    applyAuthCookie(response, newUser.id);
    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    const message =
      error?.name === "ZodError"
        ? error.issues?.[0]?.message || "Invalid registration details"
        : error.message || "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
