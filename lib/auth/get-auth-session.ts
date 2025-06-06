// PRD: Auth - Enhanced session handler
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Gets the authenticated session with enhanced error handling
 * Deals with JWT decryption errors by returning null instead of throwing
 */
export async function getAuthSession() {
    try {
        const session = await getServerSession(authOptions);
        return session;
    } catch (error) {
        console.error('[Auth] Session error:', error);
        // Return null instead of throwing, so API routes can handle this gracefully
        return null;
    }
}

/**
 * Checks if there's a valid authenticated user
 * Returns user ID if authenticated, null otherwise
 */
export async function getAuthUserId() {
    try {
        const session = await getAuthSession();
        return session?.user?.id || null;
    } catch (error) {
        console.error('[Auth] Failed to get user ID:', error);
        return null;
    }
} 