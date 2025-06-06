// PRD: Auth
import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth/utils';
import { sendPasswordResetEmail } from '@/lib/services/email';
import { User } from '@/models';
import dbConnect from '@/lib/db/mongoose';

/**
 * POST /api/auth/reset/request
 * Generates a password reset token and sends an email with a reset link.
 * 
 * Request Body:
 * - email: string
 * 
 * Response:
 * - 200: Reset email sent.
 * - 400: Invalid email.
 * - 404: User not found.
 * - 500: Server error.
 */
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            // For security reasons, still return success even if user doesn't exist
            // This prevents enumeration attacks
            return NextResponse.json(
                { message: 'If an account with that email exists, we\'ve sent a password reset link.' },
                { status: 200 }
            );
        }

        // Generate a new reset token
        const token = await generateToken(user._id, 'reset');

        // Send reset email
        await sendPasswordResetEmail(email, token);

        return NextResponse.json(
            { message: 'Password reset email sent. Please check your inbox.' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Password reset request error:', error);

        return NextResponse.json(
            { message: 'Server error. Please try again later.' },
            { status: 500 }
        );
    }
} 