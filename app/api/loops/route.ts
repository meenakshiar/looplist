// PRD: CreateLoop
import { NextRequest, NextResponse } from "next/server";
import { Loop } from "@/models/Loop";
import RefreshToken from "@/models/RefreshToken";
import connectDB from "@/lib/db/connect-db";
import { z } from "zod";

// Schema for validating loop creation payload
const createLoopSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  frequency: z.union([
    z.enum(["daily", "weekdays", "3x/week"]),
    z.array(z.string()).min(1, "At least one day must be selected"),
  ]),
  startDate: z.string().or(z.date()),
  visibility: z.enum(["private", "public", "friends"]).default("private"),
  iconEmoji: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

// GET handler to fetch all loops for the authenticated user
export async function GET(req: NextRequest) {
  try {
    console.log("Fetching loops - authenticating via refreshToken cookie...");

    // Get the refresh token from HTTP-only cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      console.log("❌ Unauthorized - no refresh token cookie");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the authenticated user ID using our enhanced handler
    // Connect to database
    await connectDB();

    // Validate the refresh token and get userId
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) {
      console.log("❌ Unauthorized - invalid or expired refresh token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = tokenDoc.userId.toString();

    console.log("✅ User authenticated via refresh token, userId:", userId);

    // Fetch loops for the authenticated user
    const loops = await Loop.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ loops });
  } catch (error) {
    console.error("Error fetching loops:", error);
    return NextResponse.json(
      { error: "Failed to fetch loops" },
      { status: 500 }
    );
  }
}

// POST handler to create a new loop
export async function POST(req: NextRequest) {
  try {
    console.log(
      "📝 Loop creation request received - checking auth via refreshToken cookie..."
    );

    // Get the refresh token from HTTP-only cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      console.log("❌ Unauthorized - no refresh token cookie");
      return NextResponse.json({ error: "Unauthorized vfvf" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Validate the refresh token
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) {
      console.log("❌ Unauthorized - invalid or expired refresh token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = tokenDoc.userId.toString();
    console.log("👤 User authenticated via refresh token, userId:", userId);

    // Parse the request body
    const body = await req.json();
    console.log("📦 Request body:", JSON.stringify(body));

    // Validate the request payload
    const validationResult = createLoopSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("❌ Validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          error: "Invalid request payload",
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed");

    // Check for duplicate title for this user
    console.log("🔍 Checking for duplicate title...");
    const existingLoop = await Loop.findOne({
      ownerId: userId,
      title: validationResult.data.title,
    });
    console.log(existingLoop, "existingLoop");

    if (existingLoop) {
      console.log("⚠️ Duplicate title found");
      return NextResponse.json(
        { error: "A loop with this title already exists" },
        { status: 409 }
      );
    }

    console.log("✅ No duplicate found");

    // Create the new loop
    console.log("🔨 Creating new loop...");
    const loopData = {
      ownerId: userId,
      ...validationResult.data,
      startDate: new Date(validationResult.data.startDate),
    };
    console.log("📋 Loop data:", JSON.stringify(loopData));

    const loop = await Loop.create(loopData);
    console.log(
      "✅ Loop created successfully:",
      loop?._id ? loop._id.toString() : "ID unknown"
    );

    return NextResponse.json({ loop }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating loop:", error);
    // More detailed error info
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to create loop",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
