// PRD: Auth
import { NextRequest, NextResponse } from "next/server";
import { validateToken, generateToken } from "@/lib/auth/utils";
import { sendVerificationEmail } from "@/lib/services/email";
import { User, Token } from "@/models";
import dbConnect from "@/lib/db/mongoose";

/**
 * GET /api/auth/verify
 * Verifies a user's email using the token from the query string.
 *
 * Query Parameters:
 * - token: string
 *
 * Response:
 * - 200: Email verified successfully.
 * - 400: Invalid or expired token.
 * - 500: Server error.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Validate token
    const tokenDoc = await validateToken(token, "verification");

    if (!tokenDoc) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Find user and update verification status
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Set email as verified
    user.emailVerified = true;
    await user.save();

    // Delete verification token
    // await Token.deleteOne({ _id: tokenDoc._id });

    return NextResponse.json(
      { message: "Email verified successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify/resend
 * Resends the verification email to the user.
 *
 * Request Body:
 * - email: string
 *
 * Response:
 * - 200: Verification email sent.
 * - 400: Invalid email.
 * - 404: User not found or already verified.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate a new verification token
    const token = await generateToken(user._id, "verification");

    // Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Verification email sent. Please check your inbox." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
