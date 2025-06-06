// PRD: Auth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { User, RefreshToken } from '@/models';
import dbConnect from '@/lib/db/mongoose';

/**
 * Middleware to protect authenticated API routes
 */
export async function middleware(request: NextRequest) {
    try {
        // Get refresh token from cookie
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find the refresh token in the database (simplified query)
        const tokenDoc = await RefreshToken.findOne({
            token: refreshToken,
            expiresAt: { $gt: new Date() }
        });

        if (!tokenDoc) {
            return NextResponse.json(
                { message: 'Invalid or expired authentication' },
                { status: 401 }
            );
        }

        // Find the user (simplified query)
        const user = await User.findById(tokenDoc.userId).select('_id');
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 401 }
            );
        }

        // Add user ID to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user._id.toString());

        // Continue to the protected route
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        console.error('API auth middleware error:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}

export const config = {
    matcher: ['/((?!api/auth).*)'],
}; 