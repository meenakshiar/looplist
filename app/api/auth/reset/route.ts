// PRD: Auth
import { NextRequest, NextResponse } from 'next/server';
import { validateToken, hashPassword } from '@/lib/auth/utils';
import { User, Token } from '@/models';
import dbConnect from '@/lib/db/mongoose';

/**
 * POST /api/auth/reset
 * Resets a user's password using a token.
 * 
 * Request Body:
 * - token: string
 * - password: string
 * 
 * Response:
 * - 200: Password reset successfully.
 * - 400: Invalid or expired token, or invalid password.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Token and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Validate token
        const tokenDoc = await validateToken(token, 'reset');

        if (!tokenDoc) {
            return NextResponse.json(
                { message: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findById(tokenDoc.userId);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update user's password
        user.passwordHash = passwordHash;
        await user.save();

        // Delete used reset token
        await Token.deleteOne({ _id: tokenDoc._id });

        return NextResponse.json(
            { message: 'Password reset successfully. You can now log in with your new password.' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Password reset error:', error);

        return NextResponse.json(
            { message: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
} 