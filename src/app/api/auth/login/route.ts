import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import { z } from "zod";
import { sign } from "jsonwebtoken";

const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must have than 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = userSchema.parse(body);

    const { data: user, error } = await db
      .from("User")
      .select("*")
      .eq("username", username)
      .single();

    if (!user || error) {
      return NextResponse.json(
        { user: null, message: "User with this username does not exist" },
        { status: 404 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { user: null, message: "Invalid password" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("Internal server error: Security configuration missing");
    }

    const { password: userPassword, ...rest } = user;

    const token = sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const response = NextResponse.json(
      { user: rest, message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
