// PRD: Auth
import { NextRequest, NextResponse } from 'next/server';
import { clearRefreshTokenCookie } from '@/lib/auth/utils';

/**
 * POST /api/auth/logout
 * Logs out a user by clearing their refresh token cookie.
 * 
 * Response:
 * - 200: Logout successful.
 */
export async function POST() {
    // Create response
    const response = NextResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
    );

    // Clear refresh token cookie
    clearRefreshTokenCookie(response);

    return response;
} 