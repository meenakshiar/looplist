// PRD: TrackStreaks
import { NextRequest, NextResponse } from "next/server";
import { CheckIn } from "@/models/CheckIn";
import { Loop } from "@/models/Loop";
import { Types } from "mongoose";
import { calculateStreaks } from "@/lib/streak/streak-calculator";
import { authMiddleware } from "@/lib/auth/auth-middleware";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
/**
 * POST /api/loops/:id/checkin
 * Check in a loop for a specific date
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authError = await authMiddleware(request);
    if (authError) {
      return authError;
    }

    console.log("11111111");
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    console.log("2222222");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }
    console.log("3333333");

    const loopId = params.id;

    // Validate the loop exists and belongs to the user
    const loop = await Loop.findOne({
      _id: loopId,
      ownerId: userId,
    });
    console.log("4444444");

    if (!loop) {
      return NextResponse.json(
        { error: "Loop not found or not authorized" },
        { status: 404 }
      );
    }
    console.log("555555555");

    // Parse the request body
    const body = await request.json();
    const checkInDate = body.date ? new Date(body.date) : new Date();
    console.log("666666666");

    // Normalize to midnight UTC for consistent date handling
    const normalizedDate = new Date(checkInDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    console.log("777777777");

    // Check if a check-in already exists for this date
    const existingCheckIn = await CheckIn.findOne({
      loopId: new Types.ObjectId(loopId),
      userId: new Types.ObjectId(userId),
      date: normalizedDate,
    });
    console.log("888888888");

    if (existingCheckIn) {
      // Return the existing check-in (idempotent behavior)
      return NextResponse.json({ checkIn: existingCheckIn });
    }
    console.log("9999999");

    // Create new check-in
    const newCheckIn = new CheckIn({
      loopId: new Types.ObjectId(loopId),
      userId: new Types.ObjectId(userId),
      date: normalizedDate,
      status: "done",
    });
    console.log("10101010");

    await newCheckIn.save();

    // Recalculate and update streak metrics
    const updatedStreaks = await calculateStreaks(loopId, userId);
    console.log("11111111");

    // Update the loop with new streak metrics
    await Loop.findByIdAndUpdate(loopId, {
      currentStreak: updatedStreaks.currentStreak,
      longestStreak: updatedStreaks.longestStreak,
    });
    console.log("1212121212");

    return NextResponse.json({
      checkIn: newCheckIn,
      currentStreak: updatedStreaks.currentStreak,
      longestStreak: updatedStreaks.longestStreak,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}

/**
 * GET /api/loops/:id/checkin
 * Get all check-ins for a loop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("lllllll");
  try {
    // Authenticate user
    const authError = await authMiddleware(request);
    if (authError) {
      return authError;
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const loopId = params.id;

    // Validate the loop exists and belongs to the user
    const loop = await Loop.findOne({
      _id: loopId,
      ownerId: userId,
    });

    if (!loop) {
      return NextResponse.json(
        { error: "Loop not found or not authorized" },
        { status: 404 }
      );
    }

    // Fetch all check-ins for this loop
    const checkIns = await CheckIn.find({
      loopId: new Types.ObjectId(loopId),
      userId: new Types.ObjectId(userId),
    }).sort({ date: -1 }); // Sort by date descending (newest first)

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error("Fetch check-ins error:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 }
    );
  }
}
