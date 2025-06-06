// PRD: Auth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal middleware that doesn't interfere with auth flow
export function middleware(request: NextRequest) {
    // Just pass-through all requests
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Only match API routes that need middleware
        '/api/((?!auth).*)',
    ],
}; 