// PRD: Auth
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Authentication middleware that can be used to protect API routes
 * Returns a 401 Unauthorized response if not authenticated
 */
export async function authMiddleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
    console.log(session, "session");
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized..." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Continue to the handler if authenticated
}

export default authMiddleware;
