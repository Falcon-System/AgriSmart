import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  lastName: z.string().min(1, "Last name is required").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  phoneNumber: z.string().min(1, "Phone number is required").max(100),
  organization: z.string().optional(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must have than 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, firstName, lastName, phoneNumber, organization, password } = userSchema.parse(body);

    const { data: existingUserByUsername } = await db
      .from("User")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUserByUsername) {
      return NextResponse.json(
        { user: null, message: "User with this username already exists" },
        { status: 409 }
      );
    }

    const { data: existingUserByEmail } = await db
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const { data: existingUserByPhoneNumber } = await db
      .from("User")
      .select("id")
      .eq("phoneNumber", phoneNumber)
      .single();

    if (existingUserByPhoneNumber) {
      return NextResponse.json(
        { user: null, message: "User with this phone number already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const userId = crypto.randomUUID();
    
    const { data: newUser, error: createError } = await db
      .from("User")
      .insert({
        id: userId,
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        organization,
        password: hashedPassword,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    const { password: newUserPassword, ...rest } = newUser;

    return NextResponse.json(
      { user: rest, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
