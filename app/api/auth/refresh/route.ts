// PRD: Auth
import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken, SIX_MONTHS_SEC } from '@/lib/auth/utils';
import { User, RefreshToken } from '@/models';
import dbConnect from '@/lib/db/mongoose';
import { ObjectId } from 'mongodb';

/**
 * POST /api/auth/refresh
 * Refreshes the access token using a refresh token from the cookies.
 * 
 * Request:
 * - Cookies: refreshToken (HTTP-only)
 * 
 * Response:
 * - 200: Returns new access token and refreshes the refresh token cookie.
 * - 401: Invalid or expired refresh token.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
    try {
        // Get the refresh token from HTTP-only cookie
        const refreshTokenCookie = req.cookies.get('refreshToken')?.value;

        if (!refreshTokenCookie) {
            console.log('No refresh token cookie found');
            return NextResponse.json(
                { message: 'No refresh token found' },
                { status: 401 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find the refresh token in the database
        const tokenDoc = await RefreshToken.findOne({ token: refreshTokenCookie });

        if (!tokenDoc) {
            console.log('Refresh token not found in database');
            return NextResponse.json(
                { message: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        // Check if token is expired
        if (tokenDoc.expiresAt < new Date()) {
            console.log('Refresh token expired');
            await RefreshToken.deleteOne({ _id: tokenDoc._id });
            return NextResponse.json(
                { message: 'Refresh token expired' },
                { status: 401 }
            );
        }

        const userId = tokenDoc.userId.toString();

        // Find user by ID
        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            console.log(`User not found for ID: ${userId}`);
            return NextResponse.json(
                { message: 'User not found' },
                { status: 401 }
            );
        }

        // Generate new access token
        const accessToken = generateAccessToken(user._id.toString(), user.email);

        // Generate new refresh token
        const newRefreshToken = await generateRefreshToken(user._id.toString());

        // Create response with user data and access token only
        const response = NextResponse.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                emailVerified: user.emailVerified,
            },
            accessToken,
        }, { status: 200 });

        // Set new refresh token in HTTP-only cookie
        const expires = new Date();
        expires.setTime(expires.getTime() + SIX_MONTHS_SEC * 1000);

        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expires,
            path: '/',
        });

        // Add auth debug cookie
        response.cookies.set('auth_refresh_time', new Date().toISOString(), {
            httpOnly: false,
            maxAge: 60 * 60, // 1 hour
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Refresh token error:', error);

        return NextResponse.json(
            { message: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
} 