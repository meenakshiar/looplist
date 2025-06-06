// PRD: Auth
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateAccessToken, generateRefreshToken, SIX_MONTHS_SEC } from '@/lib/auth/utils';
import { User } from '@/models';
import dbConnect from '@/lib/db/mongoose';

/**
 * POST /api/auth/login
 * Authenticates a user and issues JWT tokens.
 * 
 * Request Body:
 * - email: string
 * - password: string
 * 
 * Response:
 * - 200: Authentication successful, returns user and access token.
 * - 400: Validation error.
 * - 401: Invalid credentials.
 * - 403: Email not verified.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        // Basic validation
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return NextResponse.json(
                { message: 'Please verify your email before logging in' },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Convert the user ID to string to ensure it works with JWT
        const userId = user._id.toString();

        // Generate access token to return in response
        const accessToken = generateAccessToken(userId, user.email);

        // Generate refresh token for HTTP-only cookie
        const refreshToken = await generateRefreshToken(userId);

        // Create response with user data and access token
        const response = NextResponse.json({
            user: {
                id: userId,
                email: user.email,
                emailVerified: user.emailVerified,
            },
            accessToken,
        }, { status: 200 });

        // Set refresh token in HTTP-only cookie (can't be accessed by JavaScript)
        const expires = new Date();
        expires.setTime(expires.getTime() + SIX_MONTHS_SEC * 1000);

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true, // Can't be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expires,
            path: '/',
        });

        // Add auth debug cookie
        response.cookies.set('auth_login_time', new Date().toISOString(), {
            httpOnly: false,
            maxAge: 60 * 60, // 1 hour
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);

        return NextResponse.json(
            { message: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
} 