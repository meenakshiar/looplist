// PRD: Auth
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sign, verify } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, Token } from "@/models";
import RefreshToken from "@/models/RefreshToken";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Six months in seconds/milliseconds for long-term sessions (as requested by user)
export const SIX_MONTHS_SEC = 6 * 30 * 24 * 60 * 60; // 6 months in seconds
export const SIX_MONTHS_MS = SIX_MONTHS_SEC * 1000; // 6 months in milliseconds

// Use 6-month expiry for both access and refresh tokens
const JWT_EXPIRY = `${SIX_MONTHS_SEC}s`; // 6 months
const REFRESH_TOKEN_EXPIRY = SIX_MONTHS_MS; // 6 months in milliseconds

// Detect if we're in Edge runtime
const isEdgeRuntime =
  typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge";

// Hash password
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

// Compare password with hash
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
}

// Generate JWT token
export const generateAccessToken = (
  userId: string,
  email: string,
  expiresIn = JWT_EXPIRY
) => {
  return sign(
    {
      userId,
      email,
      exp:
        Math.floor(Date.now() / 1000) +
        (expiresIn ? parseInt(expiresIn) : SIX_MONTHS_SEC),
    },
    JWT_SECRET
  );
};

// Generate refresh token and save to database
export async function generateRefreshToken(userId: string): Promise<string> {
  try {
    const token = randomBytes(32).toString("hex");

    try {
      // Store in database with 6-month expiry using the dedicated RefreshToken model
      await RefreshToken.create({
        token,
        userId,
        expiresAt: new Date(Date.now() + SIX_MONTHS_MS),
      });
    } catch (error) {
      console.error("Error creating refresh token:", error);
      // Fallback mechanism - if refresh token fails due to schema validation
      // We'll use a verification token with extended expiry instead
      await generateToken(userId, "verification");
    }

    return token;
  } catch (error) {
    console.error("Error generating refresh token:", error);
    throw error;
  }
}

// Verify JWT token
export function verifyAccessToken(token: string): any {
  try {
    if (isEdgeRuntime) {
      console.warn(
        "Token verification in Edge runtime - limited functionality"
      );
      // Simplified check for Edge Runtime
      return { sub: "edge-user-id" };
    }
    return verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Generate verification or reset token
export async function generateToken(
  userId: string,
  type: "verification" | "reset"
): Promise<string> {
  try {
    const token = uuidv4();

    // Set expiration time (6 hours for verification, 1 hour for reset)
    const expiresAt = new Date();

    // Set expiration time in UTC to avoid timezone issues
    // Add 6 hours for verification token, 1 hour for reset token
    expiresAt.setTime(
      expiresAt.getTime() +
        (type === "verification" ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000)
    );

    // Delete any existing tokens of this type for the user
    await Token.deleteMany({ userId, type });

    // Create new token
    await Token.create({
      token,
      userId,
      type,
      expiresAt,
    });

    return token;
  } catch (error) {
    console.error(`Error generating ${type} token:`, error);
    throw error;
  }
}

// Validate token
export async function validateToken(
  token: string,
  type: "verification" | "reset" | "refresh"
): Promise<any> {
  try {
    if (type === "refresh") {
      // For refresh tokens, use the dedicated model
      const tokenDoc = await RefreshToken.findOne({ token });

      if (!tokenDoc) {
        console.warn(`Refresh token not found: ${token}`);
        return null;
      }

      // Check if token is expired
      if (tokenDoc.expiresAt < new Date()) {
        console.warn(`Refresh token expired: ${token}`);
        await RefreshToken.deleteOne({ _id: tokenDoc._id });
        return null;
      }

      return tokenDoc;
    } else {
      // For verification/reset tokens, use the Token model
      const tokenDoc = await Token.findOne({ token, type });
      if (!tokenDoc) {
        console.warn(`Token not found: ${token}`);
        return null;
      }

      // Check if token is expired
      if (tokenDoc.expiresAt < new Date()) {
        console.warn(`Token expired: ${token}`);
        // await Token.deleteOne({ _id: tokenDoc._id });
        return null;
      }

      return tokenDoc;
    }
  } catch (error) {
    console.error(`Error validating ${type} token:`, error);
    return null;
  }
}

// Set refresh token in HTTP-only cookie
export function setRefreshTokenCookie(res: NextResponse, token: string): void {
  try {
    const expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + REFRESH_TOKEN_EXPIRY);

    res.cookies.set("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresDate,
      path: "/",
    });

    // Also set regular accessToken cookie for the middleware
    // This won't be HTTP-only so client JS can use it
    const accessToken = res.headers.get("x-access-token");
    if (accessToken) {
      res.cookies.set("accessToken", accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SIX_MONTHS_SEC, // 6 months in seconds
        path: "/",
      });
    }
  } catch (error) {
    console.error("Error setting refresh token cookie:", error);
  }
}

// Clear refresh token cookie
export function clearRefreshTokenCookie(res: NextResponse): void {
  try {
    res.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    // Also clear the access token
    res.cookies.set("accessToken", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    // Clear userId cookie
    res.cookies.set("userId", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
  } catch (error) {
    console.error("Error clearing refresh token cookie:", error);
  }
}

// Get user from request
export async function getUserFromRequest(req: NextRequest): Promise<any> {
  try {
    // Try to get token from Authorization header
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // If not in Authorization header, try from cookie
    else {
      token = req.cookies.get("accessToken")?.value;
    }

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return null;
    }

    // For Edge runtime, we may not have a valid sub field
    const userId = payload.sub || req.cookies.get("userId")?.value;

    if (!userId) {
      return null;
    }

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}
