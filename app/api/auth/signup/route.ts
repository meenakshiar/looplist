// PRD: Auth
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth/utils";
import { sendVerificationEmail } from "@/lib/services/email";
import { User } from "@/models";
import dbConnect from "@/lib/db/mongoose";

/**
 * POST /api/auth/signup
 * Creates a new user and sends a verification email.
 *
 * Request Body:
 * - email: string
 * - password: string
 *
 * Response:
 * - 201: User created successfully, verification email sent.
 * - 400: Validation error.
 * - 409: Email already exists.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !email.includes("@") || !password || password.length < 8) {
      return NextResponse.json(
        { message: "Invalid email or password (minimum 8 characters)" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const user = await User.create({
      email,
      passwordHash,
      emailVerified: false,
    });

    // Generate verification token
    const token = await generateToken(user._id, "verification");

    // Send verification email
    await sendVerificationEmail(email, token);
    console.log('bbbbbbbbbbbb')
    
    return NextResponse.json(
      {
        message:
          "User created successfully. Please check your email to verify your account.",
        },
        { status: 201 }
      );
    } catch (error: any) {
    console.log('aaaaaaaaaa')
    console.error("Signup error :", error);

    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
